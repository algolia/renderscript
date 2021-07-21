import type { Metrics, TaskResult } from 'lib/types';

export abstract class Task {
  _results: TaskResult | undefined;
  _metrics: Metrics = {
    goto: null,
    forcedWait: null,
    serialize: null,
    total: null,
  };

  get isProcessed(): boolean {
    return typeof this.results !== 'undefined';
  }

  get results(): TaskResult | undefined {
    return this._results;
  }

  get metrics(): Metrics {
    return this._metrics;
  }

  abstract process(): Promise<void>;
}
