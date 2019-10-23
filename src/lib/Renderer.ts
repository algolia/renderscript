import * as path from "path";

import * as puppeteer from "puppeteer-core";
import * as uuid from "uuid/v4";
import { validateURL, PRIVATE_IP_PREFIXES } from '@algolia/dns-filter';

const RESTRICTED_IPS = process.env.NODE_ENV === 'development'
  ? PRIVATE_IP_PREFIXES.filter((prefix: string) => !['127.', '0.', '::1'].includes(prefix)) // allow everything in dev
  : PRIVATE_IP_PREFIXES; // no private IPs otherwise

import injectBaseHref from "lib/helpers/injectBaseHref";
import getChromiumExecutablePath from "lib/helpers/getChromiumExecutablePath";
import getExtensionPath, { EXTENSIONS } from "lib/helpers/getExtensionPath";

import adBlocker from "lib/adBlockerSingleton";

const WIDTH = 1280;
const HEIGHT = 1024;
const IGNORED_RESOURCES = ["font", "image"];
const PAGE_BUFFER_SIZE = 2;
const TIMEOUT = 10000;

export interface taskParams {
  url: URL;
}

export interface taskResult {
  statusCode?: number;
  body?: string;
  headers?: { [s: string]: string };
  timeout?: boolean;
  error?: string;
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
  private _stopping: boolean;
  private _pageBuffer: Promise<{
    page: puppeteer.Page;
    context: puppeteer.BrowserContext;
  }>[];
  private _currentTasks: { id: string; promise: taskObject["promise"] }[];
  private _extensionsData: {
    [id: string]: {
      name: string;
    };
  };
  private _createBrowserPromise: Promise<void> | null;

  constructor() {
    this.id = uuid();
    this.ready = false;
    this.nbTotalTasks = 0;
    this._browser = null;
    this._stopping = false;
    this._createBrowserPromise = this._createBrowser();
    this._pageBuffer = Array.from(new Array(PAGE_BUFFER_SIZE), () =>
      this._createNewPage()
    );
    this._currentTasks = [];
    this._extensionsData = {};

    Promise.all(this._pageBuffer).then(() => {
      this.ready = true;
      console.info(`Browser ${this.id} ready`);
    });
  }

  async task(job: taskParams) {
    if (this._stopping) {
      throw new Error("Called task on a stopping Renderer");
    }
    ++this.nbTotalTasks;

    const id = uuid();
    const promise = this._processPage(job, id);
    this._addTask({ id, promise });

    const res = await promise;

    this._removeTask({ id });

    return res;
  }

  async stop() {
    this._stopping = true;
    console.info(`Browser ${this.id} stopping...`);
    while (!this.ready) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    await Promise.all(this._currentTasks.map(({ promise }) => promise));
    await Promise.all(this._pageBuffer);
    const browser = await this._getBrowser();
    await browser.close();
    console.info(`Browser ${this.id} stopped`);
  }

  async healthy() {
    if (this._stopping) return false;
    try {
      const browser = await this._getBrowser();
      await browser.version();
      return true;
    } catch (e) {
      return false;
    }
  }

  private async _createBrowser() {
    console.info(`Browser ${this.id} creating...`);

    const extensions = await Promise.all(EXTENSIONS.map(getExtensionPath));

    // Call this before launching the browser,
    // otherwise the launch call might timeout
    await adBlocker.waitForReadyness();

    const env: { [s: string]: string } = {};
    if (process.env.DISPLAY) {
      env.DISPLAY = process.env.DISPLAY;
    }

    const browser = await puppeteer.launch({
      headless: extensions.length === 0,
      env,
      executablePath: await getChromiumExecutablePath(),
      defaultViewport: {
        width: 1920,
        height: 1080
      },
      handleSIGINT: false,
      handleSIGTERM: false,
      pipe: true,
      args: [
        // Disable sandboxing when not available
        "--no-sandbox",
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
        ...(extensions.length === 0
          ? []
          : [
              `--disable-extensions-except=${extensions.join(",")}`,
              ...extensions.map(e => `--load-extension=${e}`)
            ])
      ].filter(e => e !== "")
    });

    await this._activateIncognitoExtensions({ browser, extensions });

    // Try to load a test page first
    const testPage = await browser.newPage();
    await testPage.goto("about://settings", { waitUntil: "networkidle0" });

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
    const getExtensionsDataCode = `
      Array.from(
        document
          .querySelector("body > extensions-manager")
          .shadowRoot.querySelector("#items-list")
          .shadowRoot.querySelectorAll('extensions-item')
      ).reduce((res, $ext) => ({
        [$ext.id]: {
          name: $ext.shadowRoot.querySelector('#name').innerText.trim()
        }
      }), {});
    `;
    await extensionsPage.waitForFunction(
      `(() => { try { ${getExtensionsDataCode}; return true; } catch (e) { return false; } })`
    );
    this._extensionsData = await extensionsPage.evaluate(getExtensionsDataCode);

    const getIncognitoButtonCode = `
      document
        .querySelector("body > extensions-manager")
        .shadowRoot.querySelector("#viewManager > extensions-detail-view")
        .shadowRoot.querySelector("#allow-incognito")
        .shadowRoot.querySelector("#crToggle")
    `;
    await Promise.all(
      Object.keys(this._extensionsData).map(async id => {
        // Do this in a loop because sometimes Chrome doesn't correctly save the incognito status
        while (true) {
          const extensionPage = await browser.newPage();
          await extensionPage.goto(`chrome://extensions/?id=${id}`, {
            waitUntil: "networkidle0"
          });
          await extensionPage.waitForFunction(
            `(() => { try { ${getIncognitoButtonCode}; return true; } catch (e) { return false; } })`
          );

          const toggled = await extensionPage.evaluate(
            `${getIncognitoButtonCode}.attributes['aria-pressed'].value === 'true'`
          );
          if (toggled) break;

          await extensionPage.evaluate(`${getIncognitoButtonCode}.click()`);
          // Wait a bit to leave time for the setting to be saved
          await new Promise(resolve => setTimeout(resolve, 500));

          await extensionPage.close();
        }
      })
    );

    await extensionsPage.close();
  }

  private async _createNewPage() {
    if (this._stopping) {
      throw new Error("Called _createNewPage on a stopping Renderer");
    }

    const browser = await this._getBrowser();
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();

    await page.setUserAgent("Algolia Crawler Renderscript");
    await page.setCacheEnabled(false);
    await page.setViewport({ width: WIDTH, height: HEIGHT });

    /* Ignore useless resources */
    await page.setRequestInterception(true);
    page.on("request", async req => {
      // check for ssrf attempts
      try {
        await validateURL({
          url: req.url(),
          ipPrefixes: RESTRICTED_IPS,
        });
      }
      catch (err) {
        // log.error(err);
        // report(err);
        req.abort();
      }

      try {
        // Ignore some type of resources
        if (IGNORED_RESOURCES.includes(req.resourceType())) {
          await req.abort();
          return;
        }
        // Use AdBlocker to ignore more resources
        if (
          await adBlocker.test(
            req.url(),
            req.resourceType(),
            new URL(page.url()).host
          )
        ) {
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

    return { page, context };
  }

  private async _newPage() {
    this._pageBuffer.push(this._createNewPage());
    return await this._pageBuffer.shift()!;
  }

  private async _processPage({ url }: taskParams, taskId: string) {
    /* Setup */
    const { context, page } = await this._newPage();

    let response: puppeteer.Response | null = null;
    let timeout = false;
    page.addListener("response", (r: puppeteer.Response) => {
      if (!response) response = r;
    });
    try {
      response = await page.goto(url.href, {
        timeout: TIMEOUT,
        waitUntil: "networkidle0"
      });
    } catch (e) {
      if (e.message.match(/Navigation Timeout Exceeded/)) {
        timeout = true;
      } else {
        console.error("Caught error when loading page", e);
      }
    }

    /* Fetch errors */
    if (!response) return { error: 'no_response' };

    /* Transforming */
    let statusCode = response.status();
    const baseHref = `${url.protocol}//${url.host}`;
    await page.evaluate(injectBaseHref, baseHref);

    /* Serialize */
    await page.evaluate( () => { debugger; } );
    let preSerializationUrl = page.url();
    const body = await page.evaluate("document.firstElementChild.outerHTML");
    const headers = response.headers();
    const resolvedUrl = page.url();
    /* Cleanup */
    await context.close();

    if (preSerializationUrl !== resolvedUrl) {
      // something super shady happened where the page url changed during evaluation
      return { error: 'unsafe_redirect' };
    }

    return { statusCode, headers, body, timeout, resolvedUrl };
  }

  private _addTask({ id, promise }: taskObject) {
    this._currentTasks.push({ id, promise });
  }

  private _removeTask({ id }: Pick<taskObject, "id">) {
    const idx = this._currentTasks.findIndex(({ id: _id }) => id === _id);
    // Should never happen
    if (idx === -1) throw new Error("Could not find task");
    this._currentTasks.splice(idx, 1);
  }
}

export default Renderer;
