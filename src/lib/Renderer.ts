import { validateURL } from '@algolia/dns-filter';
import puppeteer from 'puppeteer-core';
import type {
  HTTPResponse,
  Browser,
  HTTPRequest,
  Page,
} from 'puppeteer-core/lib/esm/puppeteer/api-docs-entry';
import { v4 as uuid } from 'uuid';

import { FetchError } from 'api/helpers/errors';
import { stats } from 'helpers/stats';
import { getChromiumExecutablePath } from 'lib/helpers/getChromiumExecutablePath';
import { injectBaseHref } from 'lib/helpers/injectBaseHref';

import {
  DATA_REGEXP,
  flags,
  HEIGHT,
  IGNORED_RESOURCES,
  PAGE_BUFFER_SIZE,
  RESTRICTED_IPS,
  WIDTH,
  TIMEOUT,
} from './constants';
import { LoginTask } from './tasks/Login';
import { PageTask } from './tasks/Page';
import type { Task } from './tasks/Task';
import type {
  NewPage,
  TaskObject,
  TaskParams,
  TaskFinal,
  TaskBaseParams,
} from './types';

class Renderer {
  id: string;
  ready: boolean;
  nbTotalTasks: number;
  private _browser: Browser | null;
  private _stopping: boolean;
  private _pageBuffer: Array<Promise<NewPage>>;
  private _currentTasks: Array<{ id: string; task: Task }>;
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

  async task(job: TaskParams): Promise<TaskFinal> {
    if (this._stopping) {
      throw new Error('Called task on a stopping Renderer');
    }
    const start = Date.now();
    console.log('Processing:', job.url.toString(), `(${job.type})`);

    ++this.nbTotalTasks;

    const id = uuid();
    const context = await this._newPageWithContext(job);
    let task: Task;
    if (job.type === 'login') {
      task = new LoginTask(job, context, this);
    } else {
      task = new PageTask(job, context, this);
    }
    this._addTask({ id, task });

    await task.process();
    const res = task.results!;

    this._removeTask({ id });

    stats.timing('renderscript.task', Date.now() - start, undefined, {
      type: job.type,
    });
    console.log('Done', job.url.toString());

    return { ...res, metrics: task.metrics };
  }

  async stop(): Promise<void> {
    this._stopping = true;
    console.info(`Browser ${this.id} stopping...`);
    while (!this.ready) {
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    }
    await Promise.all(this._currentTasks.map(({ task }) => task));
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

  async goto(page: Page, url: URL): Promise<HTTPResponse> {
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
        waitUntil: ['domcontentloaded', 'networkidle0'],
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

  async renderBody(page: Page, url: URL): Promise<string> {
    const baseHref = `${url.protocol}//${url.host}`;
    await page.evaluate(injectBaseHref, baseHref);
    return (await page.evaluate(
      'document.firstElementChild.outerHTML'
    )) as string;
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
    task: TaskBaseParams;
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

  private async _newPageWithContext(task: TaskBaseParams): Promise<NewPage> {
    this._pageBuffer.push(this._createNewPage());
    const { context, page } = await this._pageBuffer.shift()!;
    await page.setUserAgent(task.userAgent);
    await this._defineRequestContextForPage({ page, task });
    return { context, page };
  }
  private _addTask({ id, task }: TaskObject): void {
    this._currentTasks.push({ id, task });
  }

  private _removeTask({ id }: Pick<TaskObject, 'id'>): void {
    const idx = this._currentTasks.findIndex(({ id: _id }) => id === _id);
    // Should never happen
    if (idx === -1) throw new Error('Could not find task');
    this._currentTasks.splice(idx, 1);
  }
}

export default Renderer;
