import type { Response } from 'playwright-chromium';

import { cleanErrorMessage } from 'lib/helpers/errors';
import type { RenderTaskParams } from 'lib/types';

import { Task } from './Task';

export class RenderTask extends Task<RenderTaskParams> {
  async process(): Promise<void> {
    if (!this.page) {
      throw new Error('Calling process before createContext()');
    }

    /* Setup */
    const { url } = this.params;
    let response: Response;

    // Important to catch any redirect
    this.page.setDisableNavigation(url.href, async (newUrl) => {
      this.results.error = 'redirection';
      this.results.resolvedUrl = newUrl;

      // We save the status of the page before the navigation (hopefully)
      await this.page?.saveMetrics();

      // Hard close of the page to avoid reaching the backend
      await this.page?.close();
    });

    try {
      response = await this.page.goto(url.href, {
        timeout: this.timeBudget.get(),
        waitUntil: 'domcontentloaded',
      });
    } catch (err: any) {
      this.results.error = cleanErrorMessage(err);
      this.results.rawError = err;

      return;
    }

    // --- At this point we have just the DOM, but we want to do some checks
    await this.saveMetrics();
    this.setMetric('goto');

    // In case of redirection, initialResponse is prefered since response is probably now incorrect
    await this.saveStatus(this.page.initialResponse || response);

    if (this.page.redirection) {
      return;
    }

    // Check for html refresh
    const redirect = await this.page.checkForHttpEquivRefresh({
      timeout: this.timeBudget.limit(1000),
    });
    this.setMetric('equiv');
    if (redirect) {
      this.results.error = 'redirection';
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
      await this.page.ref?.waitForLoadState('networkidle', {
        timeout: this.timeBudget.get(),
      });
    } catch (err: any) {
      this.page.throwIfNotTimeout(err);
    }

    this.setMetric('ready');
    await this.minWait();

    const newUrl = this.page.ref?.url();
    if (newUrl !== url.href) {
      // Redirection was not caught this should not happen
      this.results.error = 'wrong_redirection';
      this.results.resolvedUrl = newUrl || 'unknown';
      return;
    }

    /* Transforming */
    // await page.evaluate(injectBaseHref, baseHref);
    const body = await this.page.renderBody();
    this.results.body = body;
    this.setMetric('serialize');
  }
}
