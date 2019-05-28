import * as puppeteer from "puppeteer-core";
import * as uuid from "uuid/v4";

import injectBaseHref from "lib/helpers/injectBaseHref";
import getChromiumExecutablePath from "lib/helpers/getChromiumExecutablePath";
import getExtensionPath, { EXTENSIONS } from "lib/helpers/getExtensionPath";

const WIDTH = 1280;
const HEIGHT = 1024;
const IGNORED_RESOURCES = ["font", "image"];
const PAGE_BUFFER_SIZE = 2;
const TIMEOUT = 20000;

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
  id: string;
  ready: boolean;
  nbTotalTasks: number;
  private _browser: puppeteer.Browser | null;
  private _pageBuffer: Promise<{
    page: puppeteer.Page;
    context: puppeteer.BrowserContext;
  }>[];
  private _currentTasks: { id: string; promise: taskObject["promise"] }[];
  private _extensionIds: string[];
  private _createBrowserPromise: Promise<void> | null;

  constructor() {
    this.id = uuid();
    this.ready = false;
    this.nbTotalTasks = 0;
    this._browser = null;
    this._createBrowserPromise = this._createBrowser();
    this._pageBuffer = Array.from(new Array(PAGE_BUFFER_SIZE), () =>
      this._createNewPage()
    );
    this._currentTasks = [];
    this._extensionIds = [];

    Promise.all(this._pageBuffer).then(() => {
      this.ready = true;
      console.info(`Browser ${this.id} ready`);
    });
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
    console.info(`Browser ${this.id} stopping...`);
    await Promise.all(this._currentTasks.map(({ promise }) => promise));
    const browser = await this._getBrowser();
    await browser.close();
    console.info(`Browser ${this.id} stopped`);
  }

  private async _createBrowser() {
    const extensions = await Promise.all(EXTENSIONS.map(getExtensionPath));
    const browser = await puppeteer.launch({
      headless: false,
      env: { DISPLAY: process.env.DISPLAY || "" },
      executablePath: await getChromiumExecutablePath(),
      defaultViewport: {
        width: 1920,
        height: 1080
      },
      handleSIGINT: false,
      handleSIGTERM: false,
      args: [
        // Couldn't find a way to keep the sandbox inside Docker
        "--no-sandbox",
        "--disable-setuid-sandbox",
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
        "--disable-notifications",
        "--disable-translate",
        "--disable-infobars",
        "--disable-features=TranslateUI",
        // Disable dev-shm
        // See https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#tips
        "--disable-dev-shm-usage",
        // Extensions
        `--disable-extensions-except=${extensions.join(",")}`,
        ...extensions.map(e => `--load-extension=${e}`)
      ].filter(e => e !== "")
    });

    await this._activateIncognitoExtensions({ browser, extensions });

    this._browser = browser;
    this._createBrowserPromise = null;
  }

  // Not a `get`ter because the method is `async`
  private async _getBrowser() {
    if (this._createBrowserPromise) {
      await this._createBrowserPromise;
    }

    // We know that _browser is created at the end of the promise
    return this._browser as puppeteer.Browser;
  }

  private async _activateIncognitoExtensions({
    browser,
    extensions
  }: {
    browser: puppeteer.Browser;
    extensions: string[];
  }) {
    if (extensions.length === 0) return;

    // Allow extensions in incognito mode
    const extensionsPage = await browser.newPage();
    await extensionsPage.goto("chrome://extensions", {
      waitUntil: "networkidle0"
    });
    const getExtensionIdsCode = `
      Array.from(
        document
          .querySelector("body > extensions-manager")
          .shadowRoot.querySelector("#items-list")
          .shadowRoot.querySelectorAll('extensions-item')
      ).map(n => n.id)
    `;
    await extensionsPage.waitForFunction(
      `(() => { try { ${getExtensionIdsCode}; return true; } catch (e) { return false; } })`
    );
    const extensionIds: [string] = await extensionsPage.evaluate(
      getExtensionIdsCode
    );
    this._extensionIds = extensionIds;
    await extensionsPage.close();

    const getIncognitoButtonCode = `
      document
        .querySelector("body > extensions-manager")
        .shadowRoot.querySelector("#viewManager > extensions-detail-view")
        .shadowRoot.querySelector("#allow-incognito")
        .shadowRoot.querySelector("#crToggle")
        .shadowRoot.querySelector("#knob")
    `;
    await Promise.all(
      extensionIds.map(async id => {
        const extensionPage = await browser.newPage();
        await extensionPage.goto(`chrome://extensions/?id=${id}`, {
          waitUntil: "networkidle0"
        });
        await extensionPage.waitForFunction(
          `(() => { try { ${getIncognitoButtonCode}; return true; } catch (e) { return false; } })`
        );
        await extensionPage.evaluate(`${getIncognitoButtonCode}.click()`);
        await extensionPage.close();
      })
    );
  }

  private async _createNewPage() {
    const browser = await this._getBrowser();
    const context = await browser.createIncognitoBrowserContext();
    const pagePromise = context.newPage();
    // This is hacky, but we need to run the background process for uBlock manually
    // See https://github.com/GoogleChrome/puppeteer/issues/4479
    const extensionsPromise = Promise.all(
      this._extensionIds.map(async extensionId => {
        const extensionPage = await context.newPage();
        const extensionUrl = `chrome-extension://${extensionId}/background.html`;
        extensionPage.goto(extensionUrl);
      })
    );
    const [page] = await Promise.all([pagePromise, extensionsPromise]);
    await page.setUserAgent("Algolia Crawler Renderscript");
    return { page, context };
  }

  private async _newPage() {
    this._pageBuffer.push(this._createNewPage());
    return await this._pageBuffer.shift()!;
  }

  private async _processPage({ url }: taskParams) {
    /* Setup */
    const { context, page } = await this._newPage();

    await page.setViewport({ width: 1920, height: 1080 });

    /* Ignore useless resources */
    await page.setRequestInterception(true);
    page.on("request", async req => {
      try {
        if (IGNORED_RESOURCES.includes(req.resourceType())) {
          await req.abort();
          return;
        }
        // console.log(req.resourceType(), req.url());
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
        timeout: TIMEOUT,
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
    await context.close();

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
