import type { BrowserContext, Response } from 'playwright';

import type { Browser } from 'lib/browser/Browser';
import { BrowserPage } from 'lib/browser/Page';
import { WAIT_TIME } from 'lib/constants';
import type { Metrics, TaskBaseParams, TaskResult } from 'lib/types';

export abstract class Task<TTaskType extends TaskBaseParams = TaskBaseParams> {
  params;
  page?: BrowserPage;
  results: TaskResult = {
    startAt: Date.now(),
    statusCode: undefined,
    body: undefined,
    headers: {},
    timeout: undefined,
    error: undefined,
    resolvedUrl: undefined,
    cookies: undefined,
  };
  metrics: Metrics = {
    context: null,
    goto: null,
    equiv: null,
    ready: null,
    minWait: null,
    serialize: null,
    total: null,
    page: null,
  };

  #closed: boolean = false;
  #processed: boolean = false;
  #context?: BrowserContext;
  #browser?: Browser;

  constructor(params: TTaskType, browser: Browser) {
    this.params = params;
    this.#browser = browser;
  }

  get isProcessed(): boolean {
    return typeof this.results !== 'undefined';
  }

  async close(): Promise<void> {
    if (this.#closed) {
      return;
    }

    this.#closed = true;
    await this.page?.close();
    await this.#context?.close();

    this.metrics.total = Date.now() - this.results.startAt;

    this.#browser = undefined;
    this.#context = undefined;
  }

  /**
   * Create the incognito context and the page so each task has a fresh start.
   */
  async createContext(): Promise<void> {
    this.#processed = true;
    this.results.startAt = Date.now();

    const context = await this.#browser!.getNewContext({
      userAgent: this.params.userAgent,
    });
    context.setDefaultTimeout(WAIT_TIME.max);

    const page = new BrowserPage(context);
    this.page = page;
    this.#context = context;

    await page.create();

    if (this.params.headersToForward.cookies) {
      page.setCookies(this.params);
    }

    await context.route('**/*', page.getOnRequestHandler(this.params));
    await page.disableServiceWorker();

    page.page!.on('response', page.getOnResponseHandler(this.params));

    this.metrics.context = Date.now() - this.results.startAt;
  }

  /**
   * Save status in results.
   */
  async saveStatus(response: Response): Promise<void> {
    this.results.statusCode = response.status();
    this.results.headers = await response.allHeaders();
  }

  /**
   * Wait for browser to execute more stuff before we kill the page.
   */
  async minWait(): Promise<void> {
    const start = Date.now();
    const minWait = this.params.waitTime!.min;
    const currentDuration = Date.now() - this.results.startAt;

    if (minWait && minWait > currentDuration) {
      console.log(`Waiting ${minWait - currentDuration} extra ms...`);
      await this.page!.page!.waitForTimeout(minWait - currentDuration);
    }

    this.metrics.minWait = Date.now() - start;
  }

  /**
   * Save page metrics.
   */
  async saveMetrics(): Promise<void> {
    try {
      this.metrics.page = await this.page!.saveMetrics();
    } catch (err) {
      // Can happen if target is already closed or redirection
    }
  }

  abstract process(): Promise<void>;
}
