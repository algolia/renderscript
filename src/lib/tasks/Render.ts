import type { Response } from 'playwright-chromium';

import {
  promiseWithTimeout,
  PromiseWithTimeoutError,
} from 'helpers/promiseWithTimeout';
import { waitForPendingRequests } from 'helpers/waitForPendingRequests';
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
      return this.throwHandledError({
        error: this.results.error || cleanErrorMessage(err),
        rawError: err,
      });
    } finally {
      this.setMetric('goto');
    }

    // --- At this point we have just the DOM, but we want to do some checks
    await this.saveMetrics();

    // In case of redirection, initialResponse is preferred since response is probably now incorrect
    await this.saveStatus(this.page.initialResponse || response);

    if (this.page.redirection) {
      this.results.resolvedUrl =
        this.results.resolvedUrl || this.page.redirection;
      return this.throwHandledError({
        error: this.results.error || 'redirection',
      });
    }

    // Check for html refresh
    try {
      const redirect = await promiseWithTimeout(
        this.page.checkForHttpEquivRefresh({
          timeout: this.timeBudget.getRange(1000, 3000),
        }),
        3000
      );
      if (redirect) {
        this.results.resolvedUrl = redirect.href;
        return this.throwHandledError({
          error: this.results.error || 'redirection',
        });
      }
    } catch (err) {
      if (!(err instanceof PromiseWithTimeoutError)) {
        throw err;
      }
    } finally {
      this.setMetric('equiv');
    }

    if (this.results.statusCode !== 200) {
      // Everything is different than OK is not worth processing
      this.results.body = await this.page.renderBody();
      return;
    }

    // --- Basic checks passed we wait a bit more to page to render
    try {
      const timeBudget = this.timeBudget.get();
      const startWaitTime = Date.now();

      await this.page.ref?.waitForLoadState('networkidle', {
        timeout: timeBudget,
      });
      const timeWaited = Date.now() - startWaitTime;
      await waitForPendingRequests(this.page!, timeBudget - timeWaited);
    } catch (err: any) {
      this.page.throwIfNotTimeout(err);
    } finally {
      this.setMetric('ready');
    }

    await this.minWait();

    this.checkFinalURL();

    /* Transforming */
    // await page.evaluate(injectBaseHref, baseHref);
    const body = await this.page.renderBody({ silent: true });
    if (body === null) {
      return this.throwHandledError({ error: 'body_serialisation_failed' });
    }

    this.results.body = body;
    this.setMetric('serialize');
  }

  private checkFinalURL(): void {
    const newUrl = this.page!.ref?.url() ? new URL(this.page!.ref.url()) : null;
    if (!newUrl) {
      // Redirected to nowhere
      this.results.resolvedUrl = 'about:blank/';
      return this.throwHandledError({ error: 'wrong_redirection' });
    }

    newUrl.hash = '';
    if (newUrl.href !== this.params.url.href) {
      // Redirection was not caught this should not happen
      this.results.resolvedUrl = newUrl.href;
      return this.throwHandledError({ error: 'wrong_redirection' });
    }
  }
}
