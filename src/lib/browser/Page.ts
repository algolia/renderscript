import { validateURL } from '@algolia/dns-filter';
import type {
  BrowserContext,
  HTTPRequest,
  HTTPResponse,
  Page,
} from 'puppeteer-core/lib/esm/puppeteer/api-docs-entry';

import { FetchError } from 'api/helpers/errors';
import { stats } from 'helpers/stats';
import { injectBaseHref } from 'lib/helpers/injectBaseHref';
import type { Task } from 'lib/tasks/Task';

import {
  DATA_REGEXP,
  HEIGHT,
  IGNORED_RESOURCES,
  RESTRICTED_IPS,
  WIDTH,
} from '../constants';

import type { Browser } from './Browser';

export class BrowserPage {
  #page: Page | undefined;
  #context: BrowserContext | undefined;
  #task: Task | undefined;

  get page(): Page | undefined {
    return this.#page;
  }

  get context(): BrowserContext | undefined {
    return this.#context;
  }

  /**
   * Create an empty page in a browser.
   */
  async create(browser: Browser): Promise<void> {
    const context = await browser.instance!.createIncognitoBrowserContext();

    const start = Date.now();
    const page = await context.newPage();

    await page.setUserAgent('Algolia Crawler Renderscript');
    await page.setCacheEnabled(false);
    await page.setViewport({ width: WIDTH, height: HEIGHT });

    stats.timing('renderscript.page.create', Date.now() - start);
    this.#page = page;
    this.#context = context;
  }

  async linkToTask(task: Task): Promise<void> {
    this.#task = task;
    await this.#updateContext();
  }

  async goto(url: URL): Promise<HTTPResponse> {
    let response: HTTPResponse | null = null;
    const timeout = this.#task!.params.waitTime!.max;

    this.#page!.on('response', (r) => {
      if (!response) {
        response = r;
      }
    });

    const start = Date.now();
    try {
      response = await this.#page!.goto(url.href, {
        timeout,
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

  async renderBody(url: URL): Promise<string> {
    const baseHref = `${url.protocol}//${url.host}`;

    await this.#page!.evaluate(injectBaseHref, baseHref);
    return (await this.#page!.evaluate(
      'document.firstElementChild.outerHTML'
    )) as string;
  }

  async #updateContext(): Promise<void> {
    const { url, headersToForward, userAgent } = this.#task!.params!;

    await this.#page!.setUserAgent(userAgent);

    await this.#page!.setRequestInterception(true);
    if (headersToForward.cookie) {
      const cookies = headersToForward.cookie.split('; ').map((cookie) => {
        const [key, ...v] = cookie.split('=');
        // url attribute is required because it is not possible set cookies on a blank page
        // so page.setCookie would crash if no url is provided, since we start with a blank page
        return { url: url.href, name: key, value: v.join('=') };
      });
      try {
        await this.#page!.setCookie(...cookies);
      } catch (e) {
        console.error('failed to set cookie on page', url);
      }
    }

    /* Ignore useless/dangerous resources */
    this.#page!.on('request', async (req: HTTPRequest) => {
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
}
