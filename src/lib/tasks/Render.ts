import type { Response } from 'playwright';

import { injectBaseHref } from 'lib/helpers/injectBaseHref';
import type { RenderTaskParams } from 'lib/types';

import { Task } from './Task';

export class RenderTask extends Task<RenderTaskParams> {
  async process(): Promise<void> {
    if (!this.page) {
      throw new Error('Calling process before createContext()');
    }

    /* Setup */
    const { url } = this.params;
    const baseHref = url.origin;
    const page = this.page.page!;
    let response: Response;

    try {
      this.page.setDisableNavigation(url.href);

      response = await this.page.goto(url.href, {
        timeout: this.timeBudget.get(),
        waitUntil: 'domcontentloaded',
      });
    } catch (err: any) {
      this.results.error = err.message;

      return;
    }

    // --- At this point we have just the DOM, but we want to do some checks
    this.setMetric('goto');

    await this.saveStatus(response);

    // Check for html refresh
    const redirect = await this.page.checkForHttpEquivRefresh();
    this.setMetric('equiv');
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
    try {
      // Computing maxWait minus what we already consumed
      await page.waitForLoadState('networkidle', {
        timeout: this.timeBudget.get(),
      });
    } catch (err: any) {
      this.page.throwIfNotTimeout(err);
    }
    this.setMetric('ready');

    await this.minWait();

    if (page.url() !== url.href) {
      // Redirection was not caught this should not happen
      console.error('ERROR redirection not caught');
      this.results.error = 'wrong_redirection';
      this.results.resolvedUrl = page.url();

      return;
    }

    /* Transforming */
    await page.evaluate(injectBaseHref, baseHref);
    const body = await page.content();
    this.results.body = body;
    this.setMetric('serialize');
  }
}
