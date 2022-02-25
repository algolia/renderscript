import type { BrowserPage } from 'lib/browser/Page';
import type { Metrics, TaskBaseParams, TaskResult } from 'lib/types';

export abstract class Task<TTaskType = TaskBaseParams> {
  params;
  page;
  results: TaskResult | undefined;
  metrics: Metrics = {
    goto: null,
    minWait: null,
    serialize: null,
    total: null,
    page: null,
  };
  closed: boolean = false;

  constructor(params: TTaskType, page: BrowserPage) {
    this.params = params;
    this.page = page;
  }

  get isProcessed(): boolean {
    return typeof this.results !== 'undefined';
  }

  async saveMetrics(): Promise<void> {
    try {
      this.metrics.page = await this.page.metrics();
    } catch (err) {
      // Can happen if target is already closed or redirection
    }
  }

  async close(): Promise<void> {
    if (this.closed) {
      return;
    }

    this.closed = true;
    await this.page.close();
  }

  abstract process(): Promise<void>;
}
