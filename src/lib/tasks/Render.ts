import type { HTTPResponse } from 'puppeteer-core/lib/esm/puppeteer/api-docs-entry';

import { stats } from 'helpers/stats';
import { injectBaseHref } from 'lib/helpers/injectBaseHref';
import type { RenderTaskParams } from 'lib/types';

import { Task } from './Task';

export class RenderTask extends Task<RenderTaskParams> {
  async process(): Promise<void> {
    const { url, waitTime } = this.params;
    const { page } = this.page;

    const total = Date.now();
    const minWait = waitTime!.min;
    let start = Date.now();

    let response: HTTPResponse;
    try {
      response = await this.page.goto(url);
    } catch (err) {
      this.results = {
        error: err.message,
        timeout: Boolean(err.timeout),
      };
      return;
    }
    this.metrics.goto = Date.now() - start;

    /* Transforming */
    const statusCode = response.status();
    const baseHref = `${url.protocol}//${url.host}`;
    await page!.evaluate(injectBaseHref, baseHref);

    start = Date.now();
    if (statusCode === 200 && minWait) {
      await page!.waitForTimeout(minWait - (Date.now() - total));
    }
    this.metrics.minWait = Date.now() - start;

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
    const headers = response.headers();
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
