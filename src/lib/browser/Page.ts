import { validateURL } from '@algolia/dns-filter';
import type { BrowserContext, Page, Route } from 'playwright';

import { report } from 'helpers/errorReporting';
import { stats } from 'helpers/stats';
import { injectBaseHref } from 'lib/helpers/injectBaseHref';
import { adblocker } from 'lib/singletons';
import type { PageMetrics, TaskBaseParams } from 'lib/types';

import { DATA_REGEXP, IGNORED_RESOURCES, RESTRICTED_IPS } from '../constants';

import {
  REQUEST_IGNORED_ERRORS,
  RESPONSE_IGNORED_ERRORS,
  VALIDATE_URL_IGNORED_ERRORS,
} from './constants';

/**
 * Abstract some logics around playwright pages.
 */
export class BrowserPage {
  #page: Page | undefined;
  #context: BrowserContext | undefined;
  #metrics: PageMetrics = {
    layoutDuration: null,
    scriptDuration: null,
    taskDuration: null,
    jsHeapUsedSize: null,
    jsHeapTotalSize: null,
    requests: 0,
    blockedRequests: 0,
    contentLength: 0,
    contentLengthTotal: 0,
  };
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
    console.debug('page create ', Date.now() - start);
    this.#page = page;
  }

  /**
   * Destroy the page and the private context.
   */
  async close(): Promise<void> {
    await this.#page?.close();
    await this.#context?.close();
  }

  async goto(url: string, opts: Page['goto']): Promise<Response> {
    return this.#page!.goto(url, opts);
  }

  // async getMetrics(): Promise<PageMetrics> {
  //   const metrics = await this.#page!.metrics();
  //   return {
  //     ...this.#metrics,
  //     layoutDuration: Math.round((metrics.LayoutDuration || 0) * 1000),
  //     scriptDuration: Math.round((metrics.ScriptDuration || 0) * 1000),
  //     taskDuration: Math.round((metrics.TaskDuration || 0) * 1000),
  //     jsHeapUsedSize: metrics.JSHeapUsedSize || 0,
  //     jsHeapTotalSize: metrics.JSHeapTotalSize || 0,
  //   };
  // }

  // async goto(url: URL): Promise<HTTPResponse> {
  //   let response: HTTPResponse | null = null;
  //   const timeout = this.#task!.params.waitTime!.max;

  //   this.#page!.on('response', (r) => {
  //     if (!response) {
  //       response = r;
  //     }
  //   });

  //   const start = Date.now();
  //   try {
  //     // Response can be assigned here or on('response')
  //     response = await this.#page!.goto(url.href, {
  //       timeout,
  //       waitUntil: ['domcontentloaded', 'networkidle0'],
  //     });
  //   } catch (err: any) {
  //     if (err.message.match(/Navigation timeout/)) {
  //       // This error is expected has most page will reach timeout
  //       this.#hasTimeout = true;
  //       report(new Error('goto_timeout'), { url: url.href });
  //     } else {
  //       report(new Error('goto_error'), { err, url: url.href });
  //     }
  //     // we want to continue because we can still have a response
  //   } finally {
  //     stats.timing('renderscript.page.goto', Date.now() - start, undefined, {
  //       success: response ? 'true' : 'false',
  //     });
  //   }

  //   /* Fetch errors */
  //   if (!response) {
  //     throw new Error('goto_no_response');
  //   }
  //   return response;
  // }

  /**
   * Output body as a string at the moment it is requested.
   */
  async renderBody(url: URL): Promise<string> {
    console.log(`Rendering page ${url.href}...`);
    const baseHref = `${url.protocol}//${url.host}`;

    await this.#page!.evaluate(injectBaseHref, baseHref);
    return await this.#page!.evaluate('document.firstElementChild.outerHTML');
  }

  /**
   * Add cookies to the context.
   */
  async setCookies({ url, headersToForward }: TaskBaseParams): Promise<void> {
    const cookies = headersToForward.cookie.split('; ').map((cookie) => {
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
  async disableServiceWorker(): Promise<void> {
    await this.#context!.addInitScript(() => {
      // @ts-expect-error read-only prop
      delete window.navigator.serviceWorker;
    });
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
      this.#metrics.requests += 1;

      if (this.#hasTimeout) {
        // If the page was killed in the meantime we don't want to process anything else
        route.abort('blockedbyclient');
        return;
      }

      // Skip data URIs
      if (DATA_REGEXP.test(reqUrl)) {
        this.#metrics.blockedRequests += 1;
        await route.abort('blockedbyclient');
        return;
      }

      // Check for ssrf attempts = page that redirects to localhost for example
      try {
        await validateURL({
          url: reqUrl,
          ipPrefixes: RESTRICTED_IPS,
        });
      } catch (err: any) {
        if (
          !VALIDATE_URL_IGNORED_ERRORS.some((msg) => err.message.includes(msg))
        ) {
          report(new Error('Blocked url'), { err, url: reqUrl });
          this.#metrics.blockedRequests += 1;
        }

        await route.abort('blockedbyclient');
        return;
      }

      try {
        // Ignore some type of resources
        if (IGNORED_RESOURCES.includes(req.resourceType())) {
          this.#metrics.blockedRequests += 1;

          await route.abort('blockedbyclient');
          return;
        }

        // Adblocking
        if (adblock && adblocker.match(new URL(reqUrl))) {
          this.#metrics.blockedRequests += 1;

          await route.abort('blockedbyclient');
          return;
        }

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

  async #onResponse(): Promise<void> {
    const headers = res.headers();

    if (this.#hasTimeout) {
      // If the page was killed in the meantime we don't want to process anything else
      return;
    }

    let cl = 0;

    if (headers['content-length']) {
      cl = parseInt(headers['content-length'], 10);
    }

    const status = res.status();
    // Redirection does not have a body
    if (status > 300 && status < 400) {
      return;
    }

    try {
      // Not every request has the content-length header, the byteLength match perfectly
      // but does not necessarly represent what was transfered (if it was gzipped for example)
      cl = (await res.buffer()).byteLength;

      if (res.url() === url.href) {
        this.#metrics.contentLength = cl;
      }

      this.#metrics.contentLengthTotal += cl;
    } catch (err: any) {
      if (RESPONSE_IGNORED_ERRORS.some((msg) => err.message.includes(msg))) {
        return;
      }

      // We can not throw in callback, it will go directly into unhandled
      report(err, { context: 'onResponse', url: url.href });
    }
  }

  // async #updateContext(): Promise<void> {
  //   const { url, headersToForward, userAgent, adblock } = this.#task!.params!;

  //   /* Ignore useless/dangerous resources */
  //   this.#page!.on('request', async (req) => {
  // const reqUrl = req.url();
  // this.#metrics.requests += 1;

  // if (this.#hasTimeout) {
  //   // If the page was killed in the meantime we don't want to process anything else
  //   req.abort();
  //   return;
  // }

  // // Skip data URIs
  // if (DATA_REGEXP.test(reqUrl)) {
  //   this.#metrics.blockedRequests += 1;
  //   req.abort();
  //   return;
  // }

  // // check for ssrf attempts
  // try {
  //   await validateURL({
  //     url: reqUrl,
  //     ipPrefixes: RESTRICTED_IPS,
  //   });
  // } catch (err: any) {
  //   if (
  //     !VALIDATE_URL_IGNORED_ERRORS.some((msg) => err.message.includes(msg))
  //   ) {
  //     report(new Error('Blocked url'), { err, url: reqUrl });
  //     this.#metrics.blockedRequests += 1;
  //   }

  //   req.abort();
  //   return;
  // }

  // try {
  //   // Ignore some type of resources
  //   if (IGNORED_RESOURCES.includes(req.resourceType())) {
  //     this.#metrics.blockedRequests += 1;
  //     await req.abort();
  //     return;
  //   }

  //   // Adblocker
  //   if (adblock && adblocker.match(new URL(reqUrl))) {
  //     this.#metrics.blockedRequests += 1;
  //     await req.abort();
  //     return;
  //   }

  //   if (req.isNavigationRequest()) {
  //     const headers = req.headers();
  //     await req.continue({
  //       // headers ignore values set for `Cookie`, relies to page.setCookie instead
  //       headers: { ...headers, ...headersToForward },
  //     });
  //     return;
  //   }
  //   await req.continue();
  // } catch (err: any) {
  //   if (REQUEST_IGNORED_ERRORS.some((msg) => err.message.includes(msg))) {
  //     return;
  //   }

  //   report(err, { context: 'onRequest', url: url.href, with: reqUrl });
  // }
  // });

  // this.#page!.on('response', async (res) => {
  // const headers = res.headers();

  // if (this.#hasTimeout) {
  //   // If the page was killed in the meantime we don't want to process anything else
  //   return;
  // }

  // let cl = 0;

  // if (headers['content-length']) {
  //   cl = parseInt(headers['content-length'], 10);
  // }

  // const status = res.status();
  // // Redirection does not have a body
  // if (status > 300 && status < 400) {
  //   return;
  // }

  // try {
  //   // Not every request has the content-length header, the byteLength match perfectly
  //   // but does not necessarly represent what was transfered (if it was gzipped for example)
  //   cl = (await res.buffer()).byteLength;

  //   if (res.url() === url.href) {
  //     this.#metrics.contentLength = cl;
  //   }

  //   this.#metrics.contentLengthTotal += cl;
  // } catch (err: any) {
  //   if (RESPONSE_IGNORED_ERRORS.some((msg) => err.message.includes(msg))) {
  //     return;
  //   }

  //   // We can not throw in callback, it will go directly into unhandled
  //   report(err, { context: 'onResponse', url: url.href });
  // }
  //   });
  // }
}
