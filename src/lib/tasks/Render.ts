import type { Response } from 'playwright-chromium';

import {
  promiseWithTimeout,
  PromiseWithTimeoutError,
} from 'helpers/promiseWithTimeout';
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
      this.results.error = this.results.error || cleanErrorMessage(err);
      this.results.rawError = err;

      return;
    } finally {
      this.setMetric('goto');
    }

    // --- At this point we have just the DOM, but we want to do some checks
    await this.saveMetrics();

    // In case of redirection, initialResponse is prefered since response is probably now incorrect
    await this.saveStatus(this.page.initialResponse || response);

    if (this.page.redirection) {
      this.results.error = this.results.error || 'redirection';
      this.results.resolvedUrl =
        this.results.resolvedUrl || this.page.redirection;
      return;
    }

    // Check for html refresh
    try {
      const redirect = await promiseWithTimeout(
        this.page.checkForHttpEquivRefresh({
          timeout: this.timeBudget.limit(1000),
        }),
        1000
      );
      if (redirect) {
        this.results.error = 'redirection';
        this.results.resolvedUrl = redirect.href;

        return;
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
      // Computing maxWait minus what we already consumed
      await this.page.ref?.waitForLoadState('networkidle', {
        timeout: this.timeBudget.get(),
      });
    } catch (err: any) {
      this.page.throwIfNotTimeout(err);
    } finally {
      this.setMetric('ready');
    }

    await this.minWait();

    this.checkFinalURL();
    if (this.results.error) {
      return;
    }

    /* Transforming */
    // await page.evaluate(injectBaseHref, baseHref);
    const body = await this.page.renderBody();
    if (body === null) {
      this.results.error = 'body_serialisation_failed';
      return;
    }

    this.results.body = body;
    this.setMetric('serialize');
  }

  private checkFinalURL(): void {
    const newUrl = this.page!.ref?.url() ? new URL(this.page!.ref.url()) : null;
    if (!newUrl) {
      // Redirection was not caught this should not happen
      this.results.error = 'wrong_redirection';
      this.results.resolvedUrl = 'about:blank/';
      return;
    }

    newUrl.hash = '';
    if (newUrl.href !== this.params.url.href) {
      // Redirection was not caught this should not happen
      this.results.error = 'wrong_redirection';
      this.results.resolvedUrl = newUrl.href;
    }
  }
}
