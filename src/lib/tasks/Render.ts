import type { HTTPResponse } from 'puppeteer-core/lib/esm/puppeteer/api-docs-entry';

import { stats } from 'helpers/stats';
import { injectBaseHref } from 'lib/helpers/injectBaseHref';
import type { RenderTaskParams } from 'lib/types';

import { Task } from './Task';

export class RenderTask extends Task<RenderTaskParams> {
  async process(): Promise<void> {
    const { url, waitTime } = this.params;
    const { page } = this.page;
    const baseHref = `${url.protocol}//${url.host}`;

    const total = Date.now();
    const minWait = waitTime!.min;
    let start = Date.now();

    let response: HTTPResponse;
    try {
      response = await this.page.goto(url);
    } catch (err: any) {
      this.results = {
        error: err.message,
        timeout: Boolean(err.timeout),
      };
      return;
    }
    this.metrics.goto = Date.now() - start;

    const statusCode = response.status();
    const headers = response.headers();

    start = Date.now();
    if (statusCode === 200 && minWait) {
      await page!.waitForTimeout(minWait - (Date.now() - total));
    }
    this.metrics.minWait = Date.now() - start;

    if (page!.url() !== url.href) {
      this.results = {
        statusCode,
        headers,
        resolvedUrl: page!.url(),
      };
      return;
    }

    try {
      const metaRefreshElement = await page!.$('meta[http-equiv="refresh"]');
      if (metaRefreshElement) {
        console.log(await metaRefreshElement.jsonValue());
        const metaRefreshContent = await metaRefreshElement.getProperty(
          'content'
        );
        const refreshContent = await metaRefreshContent?.jsonValue<string>();
        const match = refreshContent?.match(/\d+;\s(?:url|URL)=(.*)/);
        if (match) {
          const matchedURL = match[1].replace(/'/g, ''); // Sometimes URLs are surrounded by quotes
          const redirectURL = matchedURL.startsWith('/')
            ? `${baseHref}${matchedURL}`
            : match[1];
          console.log(`Meta refresh found. Redirecting to ${redirectURL}...`);
          this.results = {
            statusCode,
            headers,
            resolvedUrl: redirectURL,
          };
          return;
        }
      }
    } catch (e) {
      console.log(
        'Error while trying to check for meta[http-equive="refresh"]',
        e
      );
    }

    /* Transforming */
    await page!.evaluate(injectBaseHref, baseHref);

    start = Date.now();
    /**
     * Serialize
     * We put a debugger to stop processing JS.
     **/
    await page!.evaluate(() => {
      // eslint-disable-next-line no-debugger
      debugger;
    });
    const preSerializationUrl = await page!.evaluate('window.location.href');
    const body = (await page!.evaluate(
      'document.firstElementChild.outerHTML'
    )) as string;
    const resolvedUrl = (await page!.evaluate(
      'window.location.href'
    )) as string;

    this.metrics.serialize = Date.now() - start;
    stats.timing('renderscript.page.serialize', Date.now() - start);

    if (preSerializationUrl !== resolvedUrl) {
      // something super shady happened where the page url changed during evaluation
      this.results = {
        error: 'unsafe_redirect',
      };
      return;
    }

    this.metrics.total = Date.now() - total;
    this.results = {
      statusCode,
      headers,
      body,
      resolvedUrl,
    };
  }
}
