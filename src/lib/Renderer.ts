import * as puppeteer from "puppeteer-core";
import * as uuid from "uuid/v4";

import injectBaseHref from "lib/helpers/injectBaseHref";
import getChromiumExecutablePath from "lib/helpers/getChromiumExecutablePath";

const WIDTH = 1920;
const HEIGHT = 1920;
const IGNORED_RESOURCES = ["font", "image"];

export interface taskParams {
  url: URL;
}

export interface taskResult {
  statusCode: number;
  content?: string;
  headers?: { [s: string]: string };
}

interface taskObject {
  id: string;
  promise: Promise<taskResult>;
}

class Renderer {
  nbTotalTasks: number;
  private _browser: puppeteer.Browser | null;
  private _createBrowserPromise: Promise<void> | null;
  private _currentTasks: { id: string; promise: taskObject["promise"] }[];

  constructor() {
    this.nbTotalTasks = 0;
    this._browser = null;
    this._createBrowserPromise = this._createBrowser();
    this._currentTasks = [];
  }

  get ready() {
    return this._browser !== null;
  }

  async task(job: taskParams) {
    ++this.nbTotalTasks;

    const id = uuid();
    const promise = this._processPage(job);
    this._addTask({ id, promise });

    const res = await promise;

    this._removeTask({ id });

    return res;
  }

  async stop() {
    await Promise.all(this._currentTasks.map(({ promise }) => promise));
    const browser = await this._getBrowser();
    browser.close();
  }

  private async _createBrowser() {
    this._browser = await puppeteer.launch({
      headless: true,
      env: {},
      executablePath: await getChromiumExecutablePath(),
      defaultViewport: {
        width: 1920,
        height: 1080
      },
      handleSIGINT: false,
      handleSIGTERM: false,
      args: [
        // As we run as root inside Docker, we need `--no-sandbox`
        process.env.IN_DOCKER ? "--no-sandbox" : "",
        // No GPU available inside Docker
        "--disable-gpu",
        // Seems like a powerful hack, not sure why
        // https://github.com/Codeception/CodeceptJS/issues/561
        "--proxy-server='direct://'",
        "--proxy-bypass-list=*",
        // Disable cache
        "--disk-cache-dir=/dev/null",
        "--media-cache-size=1",
        "--disk-cache-size=1",
        // Disable useless UI features
        "--no-first-run",
        "--noerrdialogs",
        "--disable-translate",
        "--disable-infobars",
        "--disable-features=TranslateUI",
        // Disable dev-shm
        // See https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#tips
        "--disable-dev-shm-usage"
      ].filter(e => e !== "")
    });

    this._createBrowserPromise = null;
  }

  // Not a `get`ter because the method is `async`
  private async _getBrowser() {
    if (!this.ready) {
      await this._createBrowserPromise;
    }

    // We know that _browser is created at the end of the promise
    return this._browser as puppeteer.Browser;
  }

  private async _newPage() {
    const browser = await this._getBrowser();
    const context = await browser.createIncognitoBrowserContext();
    return await context.newPage();
  }

  private async _processPage({ url }: taskParams) {
    /* Setup */
    const page = await this._newPage();

    await page.setViewport({ width: 1920, height: 1080 });

    /* Ignore useless resources */
    await page.setRequestInterception(true);
    page.on("request", async req => {
      try {
        if (IGNORED_RESOURCES.includes(req.resourceType())) {
          await req.abort();
        }
        await req.continue();
      } catch (e) {
        if (!e.message.match(/Request is already handled/)) throw e;
        // Ignore Request is already handled error
      }
    });

    let response: puppeteer.Response | null = null;
    page.addListener("response", (r: puppeteer.Response) => {
      if (!response) response = r;
    });
    try {
      response = await page.goto(url.href, {
        timeout: 30000,
        waitUntil: "networkidle0"
      });
    } catch (e) {
      console.error(e);
    }

    /* Fetch errors */
    if (!response) return { statusCode: 400 };

    /* Transforming */
    let statusCode = response.status();
    const baseHref = `${url.protocol}//${url.host}`;
    await page.evaluate(injectBaseHref, baseHref);

    /* Serialize */
    const content = await page.evaluate("document.firstElementChild.outerHTML");
    const headers = response.headers();

    /* Cleanup */
    await page.close();

    return { statusCode, headers, content };
  }

  private _addTask({ id, promise }: taskObject) {
    this._currentTasks.push({ id, promise });
  }

  private _removeTask({ id }: Pick<taskObject, "id">) {
    this._currentTasks.splice(
      this._currentTasks.findIndex(({ id: _id }) => id === id),
      1
    );
  }
}

export default Renderer;
