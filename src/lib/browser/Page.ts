import type {
  BrowserContext,
  Page,
  Route,
  Response,
} from 'playwright-chromium';

import { report } from 'helpers/errorReporting';
import { log } from 'helpers/logger';
import { stats } from 'helpers/stats';
import { isURLAllowed } from 'lib/helpers/validateURL';
import { adblocker } from 'lib/singletons';
import type { PageMetrics, TaskBaseParams } from 'lib/types';

import { DATA_REGEXP, IGNORED_RESOURCES } from '../constants';

import {
  METRICS_IGNORED_ERRORS,
  REQUEST_IGNORED_ERRORS,
  RESPONSE_IGNORED_ERRORS,
} from './constants';

/**
 * Abstract some logics around playwright pages.
 */
export class BrowserPage {
  #page: Page | undefined;
  #context: BrowserContext | undefined;
  #metrics: PageMetrics = {
    timings: {
      download: 0,
    },
    requests: {
      total: 0,
      blocked: 0,
    },
    contentLength: {
      main: 0,
      total: 0,
    },
    mem: {
      jsHeapUsedSize: null,
      jsHeapTotalSize: null,
    },
  };
  #redirection?: string;
  #hasTimeout: boolean = false;

  get page(): Page | undefined {
    return this.#page;
  }

  get context(): BrowserContext | undefined {
    return this.#context;
  }

  get isReady(): boolean {
    return Boolean(this.#page && this.#context);
  }

  get hasTimeout(): boolean {
    return this.#hasTimeout;
  }

  get redirection(): string | undefined {
    return this.#redirection;
  }

  constructor(context: BrowserContext) {
    this.#context = context;
  }

  /**
   * Create an empty page in a browser.
   */
  async create(): Promise<void> {
    const start = Date.now();
    const page = await this.#context!.newPage();

    stats.timing('renderscript.page.create', Date.now() - start);
    this.#page = page;

    page.on('crash', () => {
      // e.g: crash happen on OOM.
      report(new Error('Page crashed'), { pageUrl: page.url() });
    });
    page.on('popup', () => {
      report(new Error('Popup created'), { pageUrl: page.url() });
    });
    page.on('requestfailed', (req) => {
      log.debug('request_failed', { url: req.url() });
    });
    page.on('requestfinished', (req) => {
      log.debug('request_finished', { url: req.url() });
    });
  }

  /**
   * Destroy the page and the private context.
   */
  async close(): Promise<void> {
    await this.#page?.close();
    this.#page = undefined;
  }

  /**
   * We wrap goto to handle timeout.
   */
  async goto(
    url: string,
    opts: Parameters<Page['goto']>[1]
  ): Promise<Response> {
    let response: Response | null = null;

    function onResponse(res: Response): void {
      // We listen to response because "goto" will throw on timeout but we still want to process the doc in that case
      if (!response) {
        response = res;
      }
    }
    this.#page!.once('response', onResponse);

    const start = Date.now();
    try {
      // Response can be assigned here or on('response')
      response = await this.#page!.goto(url, opts);
    } catch (err: any) {
      if (!this.redirection && !err.message.includes('ERR_ABORTED')) {
        this.throwIfNotTimeout(err);
      }
    } finally {
      // We remove listener, because we don't want more response
      this.#page!.removeListener('response', onResponse);
    }

    stats.timing('renderscript.page.goto', Date.now() - start, undefined, {
      success: response ? 'true' : 'false',
    });

    if (!response) {
      // Just in case
      throw new Error('goto_no_response');
    }

    return response;
  }

  /**
   * Wait for navigation with timeout handling.
   */
  async waitForNavigation(
    opts: Parameters<Page['waitForNavigation']>[0]
  ): Promise<Response | null> {
    let response: Response | null = null;
    function onResponse(res: Response): void {
      // We listen to response because "goto" will throw on timeout but we still want to process the doc in that case
      if (!response) {
        response = res;
      }
    }
    this.#page!.once('response', onResponse);

    try {
      response = await this.page!.waitForNavigation(opts);
    } catch (err: any) {
      this.throwIfNotTimeout(err);
    } finally {
      // We remove listener, because we don't want more response
      this.#page!.removeListener('response', onResponse);
    }

    return response;
  }

  /**
   * Get performance metrics from the page.
   * This function can fail silently because it's non-critical resource.
   * If that happen it will return previous metrics.
   */
  async saveMetrics(): Promise<PageMetrics> {
    try {
      const perf: {
        curr: PerformanceNavigationTiming;
        all: PerformanceEntryList;
        mem: {
          jsHeapSizeLimit?: number;
          totalJSHeapSize?: number;
          usedJSHeapSize?: number;
        };
      } = JSON.parse(
        await this.#page!.evaluate(() => {
          return JSON.stringify({
            curr: performance.getEntriesByType('navigation')[0],
            all: performance.getEntries(),
            // @ts-expect-error only exists in chromium
            mem: performance.memory || {},
          });
        })
      );

      this.#metrics.timings.download = Math.round(perf.curr.duration || 0);
      this.#metrics.mem = {
        jsHeapUsedSize: perf.mem.usedJSHeapSize || 0,
        jsHeapTotalSize: perf.mem.totalJSHeapSize || 0,
      };
    } catch (err: any) {
      if (!METRICS_IGNORED_ERRORS.some((msg) => err.message.includes(msg))) {
        log.error(err);
        report(new Error('Error saving metrics'), { err });
      }
    }
    return this.#metrics;
  }

  /**
   * Output body as a string at the moment it is requested.
   */
  async renderBody(): Promise<string> {
    return await this.#page!.content();
  }

  /**
   * Add cookies to the context.
   */
  async setCookies({ url, headersToForward }: TaskBaseParams): Promise<void> {
    const cookies = headersToForward!.cookie.split('; ').map((cookie) => {
      const [key, ...v] = cookie.split('=');
      // url attribute is required because it is not possible set cookies on a blank page
      // so page.setCookie would crash if no url is provided, since we start with a blank page
      return { url: url.href, name: key, value: v.join('=') };
    });

    try {
      await this.#context!.addCookies(cookies);
    } catch (err) {
      report(new Error('Failed to set cookie'), { err, url });
    }
  }

  /**
   * Disable service workers, this is recommended.
   */
  async setDisableServiceWorker(): Promise<void> {
    await this.#context!.addInitScript(() => {
      // @ts-expect-error read-only prop
      delete window.navigator.serviceWorker;
    });
    this.#page!.on('worker', () => {
      report(new Error('WebWorker disabled but created'), {
        pageUrl: this.#page!.url(),
      });
    });
  }

  /**
   * Disable navigation. Only opt-in because Login requires navigation.
   * Because playwright has some limitation we can't cancel redirection directly, so it's not bulletproof.
   * Request will most likely be interrupted but due do code lag and event we can still have time to reach the backend.
   */
  setDisableNavigation(
    originalUrl: string,
    onNavigation: (url: string) => Promise<void>
  ): void {
    this.#page!.on('framenavigated', async (frame) => {
      if (originalUrl === frame.url()) {
        return;
      }
      if (frame.parentFrame()) {
        // Sub Frame we don't care
        return;
      }

      const url = frame.url();
      await onNavigation(url);

      // We still report just in case.
      report(new Error('unexpected navigation'), {
        pageUrl: originalUrl,
        to: url,
      });
    });

    this.page!.on('request', async (req) => {
      const url = req.url();

      // Playwright does not route redirection to route() so we need to manually catch them
      log.debug('request_start', { pageUrl: originalUrl, url });
      const main = req.frame().parentFrame() === null;
      const redir = req.isNavigationRequest();

      if (!redir || (redir && !main) || originalUrl === url) {
        return;
      }
      log.info('Will navigate', { url });

      this.#redirection = url;
      await onNavigation(url);
    });
  }

  /**
   * Helper to throw if an error is not timeout so we can reuse the response easily.
   */
  throwIfNotTimeout(err: any): Error {
    if (!(err instanceof Error) || err.name !== 'TimeoutError') {
      throw err;
    }

    // This error is expected has most page will reach timeout
    // we want to continue because we can still have a response
    this.#hasTimeout = true;
    return err;
  }

  /**
   * Get a generic request handler (route).
   * That will disallow most content a.
   */
  getOnRequestHandler({
    url,
    adblock,
    headersToForward,
  }: TaskBaseParams): (route: Route) => Promise<void> {
    return async (route: Route): Promise<void> => {
      const req = route.request();
      const reqUrl = req.url();
      this.#metrics.requests.total += 1;

      if (this.#hasTimeout) {
        // If the page was killed in the meantime we don't want to process anything else
        route.abort('blockedbyclient');
        return;
      }

      // Skip data URIs
      if (DATA_REGEXP.test(reqUrl)) {
        this.#metrics.requests.blocked += 1;
        await route.abort('blockedbyclient');
        return;
      }

      // Iframe block
      if (req.frame().parentFrame()) {
        this.#metrics.requests.blocked += 1;

        await route.abort('blockedbyclient');
        return;
      }

      // Ignore some type of resources
      if (IGNORED_RESOURCES.includes(req.resourceType())) {
        this.#metrics.requests.blocked += 1;

        await route.abort('blockedbyclient');
        return;
      }

      // Adblocking
      if (adblock && adblocker.match(new URL(reqUrl))) {
        this.#metrics.requests.blocked += 1;

        await route.abort('blockedbyclient');
        return;
      }

      // Check for ssrf attempts = page that redirects to localhost for example
      if (!(await isURLAllowed(reqUrl))) {
        this.#metrics.requests.blocked += 1;
        await route.abort('blockedbyclient');
        return;
      }

      try {
        if (req.isNavigationRequest()) {
          const headers = await req.allHeaders();
          await route.continue({
            // headers ignore values set for `Cookie`, relies to page.setCookie instead
            headers: { ...headers, ...headersToForward },
          });
          return;
        }

        await route.continue();
      } catch (err: any) {
        if (REQUEST_IGNORED_ERRORS.some((msg) => err.message.includes(msg))) {
          return;
        }

        report(err, { context: 'onRequest', url: url.href, with: reqUrl });
      }
    };
  }

  getOnResponseHandler({
    url,
  }: TaskBaseParams): (res: Response) => Promise<void> {
    return async (res: Response) => {
      if (this.#hasTimeout) {
        // If the page was killed in the meantime we don't want to process anything else
        return;
      }

      const reqUrl = res.url();
      const headers = await res.allHeaders();
      let length = 0;

      if (headers['content-length']) {
        length = parseInt(headers['content-length'], 10);
      }

      const status = res.status();

      // Redirections do not have a body
      if (status > 300 && status < 400) {
        if (!res.request().frame().parentFrame()) {
          this.#redirection = new URL(headers.location, url).href;
        }
        return;
      }

      try {
        if (length === 0) {
          // Not every request has the content-length header, the byteLength match perfectly
          // but does not necessarly represent what was transfered (if it was gzipped for example)
          length = (await res.body()).byteLength;
        }

        if (reqUrl === url.href) {
          // If this is our original URL we log it to a dedicated metric
          this.#metrics.contentLength.main = length;
        }

        this.#metrics.contentLength.total += length;
      } catch (err: any) {
        if (RESPONSE_IGNORED_ERRORS.some((msg) => err.message.includes(msg))) {
          return;
        }

        // We can not throw in callback, it will go directly into unhandled
        report(err, { context: 'onResponse', pageUrl: url.href, reqUrl });
      }
    };
  }

  /**
   * Returns the URL if found.
   */
  async checkForHttpEquivRefresh(): Promise<URL | void> {
    try {
      const metaRefreshElement = this.page!.locator(
        'meta[http-equiv="refresh"]'
      );

      if ((await metaRefreshElement.count()) <= 0) {
        return;
      }

      const el = (await metaRefreshElement.elementHandle())!;
      const metaRefreshContent = await el.getProperty('content');
      const refreshContent = await metaRefreshContent?.jsonValue();
      const match = refreshContent?.match(/\d+;\s(?:url|URL)=(.*)/);
      if (!match) {
        return;
      }

      const url = new URL(this.page!.url());

      // Sometimes URLs are surrounded by quotes
      const matchedURL = match[1].replace(/'/g, '');
      const redirectURL = new URL(matchedURL, url);

      log.debug('Meta refresh found', { redir: redirectURL.href });

      return redirectURL;
    } catch (err) {
      report(new Error('Error while trying to check for meta refresh'), {
        err,
        timeout: this.#hasTimeout,
      });
    }
  }
}
