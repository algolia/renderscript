import type { HTTPResponse } from 'puppeteer-core/lib/esm/puppeteer/api-docs-entry';

import { stats } from 'helpers/stats';
import type Renderer from 'lib/Renderer';
import { TIMEOUT } from 'lib/constants';
import { injectBaseHref } from 'lib/helpers/injectBaseHref';
import type { NewPage, RenderTaskParams } from 'lib/types';

import { Task } from './Task';

export class PageTask extends Task {
  task;
  pageContext;
  renderer;

  constructor(
    task: RenderTaskParams,
    pageContext: NewPage,
    renderer: Renderer
  ) {
    super();
    this.task = task;
    this.pageContext = pageContext;
    this.renderer = renderer;
  }

  async process(): Promise<void> {
    const { url } = this.task;
    const { context, page } = this.pageContext;

    const total = Date.now();
    const forcedWait = TIMEOUT * 0.7;
    let start = Date.now();

    let response: HTTPResponse;
    try {
      response = await this.renderer.goto(page, url);
    } catch (err) {
      this._results = {
        error: err.message,
        timeout: Boolean(err.timeout),
      };
      return;
    }
    this._metrics.goto = Date.now() - start;

    /* Transforming */
    const statusCode = response.status();
    const baseHref = `${url.protocol}//${url.host}`;
    await page.evaluate(injectBaseHref, baseHref);

    start = Date.now();
    /* minimum wait, at least 70% */
    if (statusCode === 200) {
      await page.waitForTimeout(forcedWait - (Date.now() - total));
    }
    this._metrics.forcedWait = Date.now() - start;

    start = Date.now();
    /**
     * Serialize
     * We put a debugger to stop processing JS.
     **/
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

    this._metrics.serialize = Date.now() - start;
    stats.timing('renderscript.page.serialize', Date.now() - start);

    /* Cleanup */
    await context.close();

    if (preSerializationUrl !== resolvedUrl) {
      // something super shady happened where the page url changed during evaluation
      this._results = {
        error: 'unsafe_redirect',
      };
      return;
    }

    this._metrics.total = Date.now() - total;
    this._results = {
      statusCode,
      headers,
      body,
      resolvedUrl,
    };
  }
}
