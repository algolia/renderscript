import type { Response } from 'playwright';

import { stats } from 'helpers/stats';
import { injectBaseHref } from 'lib/helpers/injectBaseHref';
import type { RenderTaskParams } from 'lib/types';

import { Task } from './Task';

export class RenderTask extends Task<RenderTaskParams> {
  async process(): Promise<void> {
    await this.createContext();
    if (!this.page) {
      return;
    }

    /* Setup */
    const { url, waitTime } = this.params;
    const baseHref = url.origin;
    const page = this.page.page!;
    let start = Date.now();
    let response: Response;

    try {
      response = await this.page.goto(url.href, {
        timeout: waitTime!.max,
        waitUntil: 'domcontentloaded',
      });
    } catch (err: any) {
      this.results.error = err.message;
      return;
    }

    // --- At this point we have just the DOM, but we want to do some checks
    this.metrics.goto = Date.now() - start;
    await this.saveStatus(response);

    const redirect = await this.page.checkForHttpEquivRefresh();
    if (redirect) {
      this.results.resolvedUrl = redirect.href;

      return;
    }

    if (this.results.statusCode !== 200) {
      // Everything is different than OK is not worth processing
      this.results.body = await this.page.renderBody();

      return;
    }

    // --- Basic checks passed we wait a bit more to page to render
    await page.waitForLoadState('networkidle');

    await this.minWait();

    if (page.url() !== url.href) {
      console.error('ERROR redirection not caught');
      // Redirection was not caught this should not happen
      this.results.error = 'redirection';
      this.results.resolvedUrl = page.url();

      return;
    }

    /* Transforming */
    start = Date.now();
    await page.evaluate(injectBaseHref, baseHref);

    const body = await page.content();

    this.metrics.serialize = Date.now() - start;
    stats.timing('renderscript.page.serialize', this.metrics.serialize);

    this.results.body = body;
  }
}
