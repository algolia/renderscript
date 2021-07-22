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
  };

  constructor(params: TTaskType, page: BrowserPage) {
    this.params = params;
    this.page = page;
  }

  get isProcessed(): boolean {
    return typeof this.results !== 'undefined';
  }

  async close(): Promise<void> {
    await this.page.page?.close();
    await this.page.context?.close();
  }

  abstract process(): Promise<void>;
}
