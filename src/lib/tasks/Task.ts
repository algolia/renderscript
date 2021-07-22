import type { BrowserPage } from 'lib/browser/Page';
import type { Metrics, TaskBaseParams, TaskResult } from 'lib/types';

export abstract class Task<TTaskType = TaskBaseParams> {
  _params;
  _page;
  _results: TaskResult | undefined;
  _metrics: Metrics = {
    goto: null,
    minWait: null,
    serialize: null,
    total: null,
  };

  constructor(params: TTaskType, page: BrowserPage) {
    this._params = params;
    this._page = page;
  }

  get isProcessed(): boolean {
    return typeof this.results !== 'undefined';
  }

  get results(): TaskResult | undefined {
    return this._results;
  }

  get metrics(): Metrics {
    return this._metrics;
  }

  get params(): TTaskType {
    return this._params;
  }

  async close(): Promise<void> {
    await this._page.page?.close();
    await this._page.context?.close();
  }

  abstract process(): Promise<void>;
}
