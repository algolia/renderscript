import type { BrowserContext, Response } from 'playwright';
import { v4 as uuid } from 'uuid';

import type { Browser } from 'lib/browser/Browser';
import { BrowserPage } from 'lib/browser/Page';
import { WAIT_TIME } from 'lib/constants';
import type { Metrics, TaskBaseParams, TaskResult } from 'lib/types';

export abstract class Task<TTaskType extends TaskBaseParams = TaskBaseParams> {
  id: string;
  params;
  page?: BrowserPage;
  createdAt?: Date;
  startedAt?: Date;
  results: TaskResult = {
    statusCode: null,
    body: null,
    headers: {},
    error: null,
    resolvedUrl: null,
    cookies: [],
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

  constructor(params: TTaskType) {
    this.id = uuid();
    // Do not print this or pass it to reporting, it contains secrets
    this.params = {
      ...params,
      waitTime: {
        ...WAIT_TIME,
        ...params.waitTime,
      },
    };
    this.createdAt = new Date();
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

    this.metrics.total = Date.now() - this.startedAt!.getTime();

    this.#context = undefined;
  }

  /**
   * Create the incognito context and the page so each task has a fresh start.
   */
  async createContext(browser: Browser): Promise<void> {
    this.#processed = true;
    this.startedAt = new Date();

    const context = await browser.getNewContext({
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

    this.metrics.context = Date.now() - this.startedAt.getTime();
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
    const currentDuration = Date.now() - this.startedAt!.getTime();

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
