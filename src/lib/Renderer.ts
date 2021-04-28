import { validateURL, PRIVATE_IP_PREFIXES } from '@algolia/dns-filter';
import puppeteer from 'puppeteer-core';
import type {
  Page,
  HTTPResponse,
  Browser,
  BrowserContext,
  HTTPRequest,
} from 'puppeteer-core/lib/esm/puppeteer/api-docs-entry';
import { v4 as uuid } from 'uuid';

import { FetchError } from 'api/helpers/errors';
import { stats } from 'helpers/stats';
import getChromiumExecutablePath from 'lib/helpers/getChromiumExecutablePath';
import injectBaseHref from 'lib/helpers/injectBaseHref';

import { flags } from './constants';

const IP_PREFIXES_WHITELIST = process.env.IP_PREFIXES_WHITELIST
  ? process.env.IP_PREFIXES_WHITELIST.split(',')
  : ['127.', '0.', '::1'];

const RESTRICTED_IPS =
  process.env.ALLOW_LOCALHOST === 'true'
    ? PRIVATE_IP_PREFIXES.filter(
        (prefix: string) => !IP_PREFIXES_WHITELIST.includes(prefix)
      ) // relax filtering
    : PRIVATE_IP_PREFIXES;

const WIDTH = 1280;
const HEIGHT = 1024;
const IGNORED_RESOURCES = [
  'font',
  'image',
  'media',
  'websocket',
  'manifest',
  'texttrack',
];
const PAGE_BUFFER_SIZE = 2;
const TIMEOUT = 10000;
const DATA_REGEXP = /^data:/i;

export interface TaskParams {
  type?: string;
  url: URL;
  userAgent: string;
  headersToForward: {
    [s: string]: string;
  };
}

export interface TaskResult {
  statusCode?: number;
  body?: string;
  headers?: Record<string, string>;
  timeout?: boolean;
  error?: string;
  resolvedUrl?: string;
}

export interface NewPage {
  page: Page;
  context: BrowserContext;
}

interface TaskObject {
  id: string;
  promise: Promise<TaskResult>;
}

class Renderer {
  id: string;
  ready: boolean;
  nbTotalTasks: number;
  private _browser: Browser | null;
  private _stopping: boolean;
  private _pageBuffer: Array<Promise<NewPage>>;
  private _currentTasks: Array<{ id: string; promise: TaskObject['promise'] }>;
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

    Promise.all(this._pageBuffer).then(() => {
      this.ready = true;
      console.info(`Browser ${this.id} ready`);
    });
  }

  async task(job: TaskParams): Promise<TaskResult> {
    if (this._stopping) {
      throw new Error('Called task on a stopping Renderer');
    }
    const start = Date.now();
    console.log('Processing:', job.url.toString());

    ++this.nbTotalTasks;

    const id = uuid();
    let promise;
    if (job.type === 'login') {
      promise = this._processLogin(job);
    } else {
      promise = this._processPage(job);
    }
    this._addTask({ id, promise });

    const res = await promise;

    this._removeTask({ id });

    stats.timing('renderscript.task', Date.now() - start);
    console.log('Done', job.url.toString());

    return res;
  }

  async stop(): Promise<void> {
    this._stopping = true;
    console.info(`Browser ${this.id} stopping...`);
    while (!this.ready) {
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    }
    await Promise.all(this._currentTasks.map(({ promise }) => promise));
    await Promise.all(this._pageBuffer);
    const browser = await this._getBrowser();
    await browser.close();
    console.info(`Browser ${this.id} stopped`);
  }

  async healthy(): Promise<boolean> {
    if (this._stopping) {
      return false;
    }

    try {
      const browser = await this._getBrowser();
      await browser.version();
      return true;
    } catch (e) {
      return false;
    }
  }

  private async _createBrowser(): Promise<void> {
    console.info(`Browser ${this.id} creating...`);

    const env: { [s: string]: string } = {};
    if (process.env.DISPLAY) {
      env.DISPLAY = process.env.DISPLAY;
    }

    let start = Date.now();
    const browser = await puppeteer.launch({
      headless: true,
      env,
      executablePath: await getChromiumExecutablePath(),
      defaultViewport: {
        width: WIDTH,
        height: HEIGHT,
      },
      handleSIGINT: false,
      handleSIGTERM: false,
      pipe: true,
      args: flags,
    });
    stats.timing('renderscript.create', Date.now() - start);

    // Try to load a test page first
    start = Date.now();
    const testPage = await browser.newPage();
    await testPage.goto('about://settings', { waitUntil: 'networkidle0' });
    stats.timing('renderscript.page.initial', Date.now() - start);

    this._browser = browser;
    this._createBrowserPromise = null;
  }

  // Not a `get`ter because the method is `async`
  private async _getBrowser(): Promise<Browser> {
    if (this._createBrowserPromise) {
      await this._createBrowserPromise;
    }

    // We know that _browser is created at the end of the promise
    return this._browser!;
  }

  private async _defineRequestContextForPage({
    page,
    task,
  }: {
    page: Page;
    task: TaskParams;
  }): Promise<void> {
    const { url, headersToForward } = task;

    await page.setRequestInterception(true);
    if (headersToForward.cookie) {
      const cookies = headersToForward.cookie.split('; ').map((c) => {
        const [key, ...v] = c.split('=');
        // url attribute is required because it is not possible set cookies on a blank page
        // so page.setCookie would crash if no url is provided, since we start with a blank page
        return { url: url.href, name: key, value: v.join('=') };
      });
      try {
        await page.setCookie(...cookies);
      } catch (e) {
        console.error('failed to set cookie on page', url);
      }
    }

    /* Ignore useless/dangerous resources */
    page.on('request', async (req: HTTPRequest) => {
      const reqUrl = req.url();

      // Skip data URIs
      if (DATA_REGEXP.test(reqUrl)) {
        req.abort();
        return;
      }

      // check for ssrf attempts
      try {
        await validateURL({
          url: reqUrl,
          ipPrefixes: RESTRICTED_IPS,
        });
      } catch (err) {
        console.error(err);
        // report(err);
        req.abort();
        return;
      }

      try {
        // Ignore some type of resources
        if (IGNORED_RESOURCES.includes(req.resourceType())) {
          await req.abort();
          return;
        }

        if (req.isNavigationRequest()) {
          const headers = req.headers();
          await req.continue({
            // headers ignore values set for `Cookie`, relies to page.setCookie instead
            headers: { ...headers, ...headersToForward },
          });
          return;
        }
        await req.continue();
      } catch (e) {
        if (!e.message.match(/Request is already handled/)) throw e;
        // Ignore Request is already handled error
      }
    });
  }

  private async _createNewPage(): Promise<NewPage> {
    if (this._stopping) {
      throw new Error('Called _createNewPage on a stopping Renderer');
    }

    const browser = await this._getBrowser();
    const context = await browser.createIncognitoBrowserContext();

    const start = Date.now();
    const page = await context.newPage();

    await page.setUserAgent('Algolia Crawler Renderscript');
    await page.setCacheEnabled(false);
    await page.setViewport({ width: WIDTH, height: HEIGHT });

    stats.timing('renderscript.page.create', Date.now() - start);
    return { page, context };
  }

  private async _newPage(): Promise<NewPage> {
    this._pageBuffer.push(this._createNewPage());
    return await this._pageBuffer.shift()!;
  }

  private async _newPageWithContext(task: TaskParams): Promise<NewPage> {
    this._pageBuffer.push(this._createNewPage());
    const { context, page } = await this._pageBuffer.shift()!;
    await page.setUserAgent(task.userAgent);
    await this._defineRequestContextForPage({ page, task });
    return { context, page };
  }

  private async _processPage(task: TaskParams): Promise<TaskResult> {
    /* Setup */
    const { url, userAgent } = task;
    const { context, page } = await this._newPage();

    await page.setUserAgent(userAgent);
    await this._defineRequestContextForPage({ page, task });

    let response: HTTPResponse | null = null;
    let timeout = false;
    page.on('response', (r) => {
      if (!response) {
        response = r;
      }
    });

    let start = Date.now();
    try {
      response = await page.goto(url.href, {
        timeout: TIMEOUT,
        waitUntil: 'networkidle0',
      });
    } catch (e) {
      if (e.message.match(/Navigation Timeout Exceeded/)) {
        timeout = true;
      } else {
        console.error('Caught error when loading page', e);
      }
    } finally {
      stats.timing('renderscript.page.goto', Date.now() - start, undefined, {
        success: response ? 'true' : 'false',
      });
    }

    /* Fetch errors */
    if (!response) {
      return { error: 'no_response' };
    }

    /* Transforming */
    const statusCode = response.status();
    const baseHref = `${url.protocol}//${url.host}`;
    await page.evaluate(injectBaseHref, baseHref);

    /* Serialize */
    start = Date.now();

    await page.evaluate(() => {
      // eslint-disable-next-line no-debugger
      debugger;
    });
    const preSerializationUrl = await page.evaluate('window.location.href');
    const body = (await page.evaluate(
      'document.firstElementChild.outerHTML'
    )) as string;
    const headers = response.headers();
    const resolvedUrl = (await page.evaluate('window.location.href')) as string;

    stats.timing('renderscript.page.serialize', Date.now() - start);

    /* Cleanup */
    await context.close();

    if (preSerializationUrl !== resolvedUrl) {
      // something super shady happened where the page url changed during evaluation
      return { error: 'unsafe_redirect' };
    }

    return { statusCode, headers, body, timeout, resolvedUrl };
  }

  private async _processLogin(task: TaskParams): Promise<TaskResult> {
    /* Setup */
    const { url } = task;
    const { context, page } = await this._newPageWithContext(task);

    let response: HTTPResponse;
    try {
      response = await this._fetch(page, url);
    } catch (e) {
      return { error: e.message, timeout: Boolean(e.timeout) };
    }

    const chain = response.request().redirectChain();
    if (chain.length > 0) {
      console.log(chain.length);
      console.log(chain[chain.length - 1].url());
    }
    const username = await page.$('input#username');
    await username!.type('admin');
    const password = await page.$('input#password');
    await password!.type('password');
    const [loginResponse] = await Promise.all([
      page.waitForNavigation(),
      password!.press('Enter'),
    ]);
    console.log(loginResponse);

    /* Cleanup */
    console.log('closing context');
    await context.close();

    return {
      statusCode: loginResponse!.status(),
      headers: loginResponse!.headers(),
    };
  }

  private async _fetch(page: Page, url: URL): Promise<HTTPResponse> {
    let response: HTTPResponse | null = null;
    page.on('response', (r) => {
      if (!response) {
        response = r;
      }
    });

    const start = Date.now();
    try {
      response = await page.goto(url.href, {
        timeout: TIMEOUT,
        waitUntil: 'networkidle0',
      });
    } catch (e) {
      if (e.message.match(/Navigation Timeout Exceeded/)) {
        throw new FetchError('no_response', true);
      } else {
        console.error('Caught error when loading page', e);
      }
    } finally {
      stats.timing('renderscript.page.goto', Date.now() - start, undefined, {
        success: response ? 'true' : 'false',
      });
    }

    /* Fetch errors */
    if (!response) {
      throw new FetchError('no_response');
    }
    return response;
  }

  private _addTask({ id, promise }: TaskObject): void {
    this._currentTasks.push({ id, promise });
  }

  private _removeTask({ id }: Pick<TaskObject, 'id'>): void {
    const idx = this._currentTasks.findIndex(({ id: _id }) => id === _id);
    // Should never happen
    if (idx === -1) throw new Error('Could not find task');
    this._currentTasks.splice(idx, 1);
  }
}

export default Renderer;
