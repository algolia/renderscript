import type { Logger } from 'pino';
import type { BrowserContext, Response } from 'playwright';
import { v4 as uuid } from 'uuid';

import { log } from '../../helpers/logger';
import { stats } from '../../helpers/stats';
import type { Browser } from '../browser/Browser';
import { BrowserPage } from '../browser/Page';
import { TimeBudget } from '../browser/TimeBudget';
import { WAIT_TIME } from '../constants';
import { ErrorIsHandledError } from '../helpers/errors';
import type {
  ErrorReturn,
  Metrics,
  TaskBaseParams,
  TaskResult,
} from '../types';
import { RESPONSE_IGNORED_ERRORS } from '../browser/constants';

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
    rawError: null,
    resolvedUrl: null,
    cookies: [],
  };
  log: Logger;
  timeBudget: TimeBudget;
  #metrics: Metrics = {
    timings: {
      context: null,
      goto: null,
      equiv: null,
      ready: null,
      minWait: null,
      serialize: null,
      close: null,
      total: null,
    },
    renderingBudget: {
      max: 0,
      consumed: 0,
    },
    page: null,
  };

  #closed: boolean = false;
  #context?: BrowserContext;

  constructor(params: TTaskType, logger?: Logger) {
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
    this.timeBudget = new TimeBudget(this.params.waitTime.max);
    this.#metrics.renderingBudget.max = this.timeBudget.max;
    this.log = logger ?? log.child({ svc: 'task', ctx: { id: this.id } });
  }

  get metrics(): Metrics {
    return this.#metrics;
  }

  get isDone(): boolean {
    return this.#closed;
  }

  async close(): Promise<void> {
    if (this.#closed) {
      return;
    }

    this.#closed = true;
    await this.page?.close();
    await this.#context?.close();
    this.setMetric('close');

    this.metrics.timings.total = Date.now() - this.startedAt!.getTime();
    this.#metrics.renderingBudget.consumed = this.timeBudget.consumed;
    this.#context = undefined;
  }

  /**
   * Create the incognito context and the page so each task has a fresh start.
   */
  async createContext(browser: Browser): Promise<void> {
    this.timeBudget.lastConsumption = Date.now();
    this.startedAt = new Date();

    const context = await browser.getNewContext({
      userAgent: this.params.userAgent,
    });
    context.setDefaultTimeout(WAIT_TIME.min);
    context.setDefaultNavigationTimeout(WAIT_TIME.max);

    const page = new BrowserPage(context, this.params.browser);
    this.page = page;
    this.#context = context;

    await page.create();

    if (this.params.headersToForward?.cookie) {
      await page.setCookies(this.params);
    }

    await context.route('**/*', page.getOnRequestHandler(this.params));
    // does not work await page.setDisableServiceWorker();

    page.ref?.on('response', page.getOnResponseHandler(this.params));

    this.setMetric('context');
  }

  /**
   * Save status in results.
   */
  async saveStatus(response: Response): Promise<void> {
    try {
      this.results.statusCode = response.status();
      this.results.headers = await response.allHeaders();
    } catch (err: any) {
      return this.throwHandledError({
        error: 'error_reading_response',
        rawError: err,
      });
    }
  }

  /**
   * Wait for browser to execute more stuff before we kill the page.
   */
  async minWait(): Promise<void> {
    const minWait = this.params.waitTime!.min;
    const todo = minWait - this.timeBudget.consumed;
    if (todo <= 0) {
      return;
    }

    this.log.debug(`Waiting ${todo} extra ms...`);
    await this.page!.ref?.waitForTimeout(todo);
    this.setMetric('minWait');
  }

  /**
   * Log metric and reduce time budget.
   */
  setMetric(name: keyof Metrics['timings']): void {
    this.#metrics.timings[name] = this.timeBudget.consume();
    stats.timing(`renderscript.page.${name}`, this.#metrics.timings[name]!);
  }

  /**
   * Save page metrics.
   */
  async saveMetrics(): Promise<void> {
    try {
      if (!this.page || this.page.isClosed) {
        // page has been closed
        return;
      }
      this.#metrics.page = await this.page.saveMetrics();
    } catch (err: any) {
      // Can happen if target is already closed or redirection
      if (RESPONSE_IGNORED_ERRORS.some((msg) => err.message.includes(msg))) {
        // Expected error when page is closed, no need to report
        return;
      }
      // Report other unexpected errors
      report(err, { context: 'saveMetrics' });
    }
  }

  /**
   * Shortcut everything.
   */
  throwHandledError(res: ErrorReturn): void {
    this.results.error = res.error;
    this.results.rawError = res.rawError || null;
    stats.increment('renderscript.task.handlederror', {
      error: res.error || 'no_error',
    });
    throw new ErrorIsHandledError();
  }

  abstract process(): Promise<void>;
}
