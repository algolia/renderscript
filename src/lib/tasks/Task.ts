import type { BrowserContext } from 'playwright';

import type { Browser } from 'lib/browser/Browser';
import { BrowserPage } from 'lib/browser/Page';
import type { Metrics, TaskBaseParams, TaskResult } from 'lib/types';

export abstract class Task<TTaskType extends TaskBaseParams = TaskBaseParams> {
  params;
  page?: BrowserPage;
  results: TaskResult | undefined;
  metrics: Metrics = {
    goto: null,
    minWait: null,
    serialize: null,
    total: null,
    page: null,
  };
  closed: boolean = false;

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
    if (this.closed) {
      return;
    }

    this.closed = true;
    await this.page?.close();
    await this.#context?.close();

    this.#browser = undefined;
    this.#context = undefined;
  }

  async createContext(): Promise<void> {
    const context = await this.#browser!.getNewContext({
      userAgent: this.params.userAgent,
    });

    const page = new BrowserPage(context);
    this.page = page;
    this.#context = context;

    await page.create();

    if (this.params.headersToForward.cookies) {
      page.setCookies(this.params);
    }

    await page.disableServiceWorker();
    await context.route('**/*', page.getOnRequestHandler(this.params));
  }

  async saveMetrics(): Promise<void> {
    try {
      this.metrics.page = await this.page!.getMetrics();
    } catch (err) {
      // Can happen if target is already closed or redirection
    }
  }

  abstract process(): Promise<void>;
}
