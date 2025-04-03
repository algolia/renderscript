import {
  RENDERSCRIPT_TASK_TYPE_TAG,
  RENDERSCRIPT_TASK_URL_TAG,
  report,
} from '../helpers/errorReporting';
import { log as mainLog } from '../helpers/logger';
import { stats } from '../helpers/stats';

import type { BrowserEngine } from './browser/Browser';
import { Browser } from './browser/Browser';
import { UNHEALTHY_TASK_TTL } from './constants';
import { cleanErrorMessage, ErrorIsHandledError } from './helpers/errors';
import type { Task } from './tasks/Task';
import type { TaskObject, TaskFinal } from './types';

export const log = mainLog.child({ svc: 'mngr' });

export class TasksManager {
  #chromium: Browser | null = null;
  #firefox: Browser | null = null;
  #stopping: boolean = true;
  #tasks: Map<string, TaskObject> = new Map();
  #totalRun: number = 0;

  getHealth(): { ready: boolean; reason?: string; oldTasks: string[][] } {
    const oldTasks: any[][] = [];

    if (this.#stopping) {
      return { ready: false, reason: 'stopping', oldTasks };
    }

    // Tasks lifecycle
    this.#tasks.forEach((task) => {
      const duration = Date.now() - task.ref.createdAt!.getTime();
      if (duration < UNHEALTHY_TASK_TTL) {
        return;
      }
      oldTasks.push([
        duration,
        task.ref.id,
        task.ref.params.url.href,
        JSON.stringify(task.ref.results),
        JSON.stringify(task.ref.metrics),
        task.ref.isDone,
      ]);
    });

    if (oldTasks.length > 0) {
      return { ready: false, reason: 'oldTasks', oldTasks };
    }

    if (this.#chromium && this.#firefox) {
      return {
        ready: this.#chromium.isReady && this.#firefox.isReady,
        reason: `browser(s) not ready: chromium: ${
          this.#chromium.isReady ? '✅' : '❌'
        } ; firefox: ${this.#firefox.isReady ? '✅' : '❌'}`,
        oldTasks,
      };
    }

    return { ready: false, oldTasks };
  }

  get currentBrowsers(): Map<BrowserEngine, Browser | null> {
    return new Map([
      ['chromium', this.#chromium],
      ['firefox', this.#firefox],
    ]);
  }

  get currentConcurrency(): number {
    return this.#tasks.size;
  }

  get totalRun(): number {
    return this.#totalRun;
  }

  async launch(): Promise<void> {
    const chromium = new Browser('chromium');
    await chromium.create();
    const firefox = new Browser('firefox');
    await firefox.create();

    this.#chromium = chromium;
    this.#firefox = firefox;
    this.#stopping = false;
    log.info('Ready');
  }

  /**
   * Register and execute a task.
   */
  async task(task: Task): Promise<TaskFinal> {
    const health = this.getHealth();
    if (!health.ready) {
      // The process can be marked as not ready because one of the browsers is not up
      // If we receive a job for a browser that is ready, only report and process it.
      if (
        (!task.params.browser || task.params.browser === 'chromium') &&
        this.#chromium?.isReady
      ) {
        report(new Error('Unhealthy node received a job but can process it'), {
          url: task.params.url,
          browser: 'chromium',
          reason: health.reason,
        });
      } else if (task.params.browser === 'firefox' && this.#firefox?.isReady) {
        report(new Error('Unhealthy node received a job but can process it'), {
          url: task.params.url,
          browser: 'firefox',
          reason: health.reason,
        });
      } else {
        throw new Error(`Unhealthy node received a job: ${health.reason}`);
      }
    }

    try {
      const promise = this.#exec(task);
      this.#totalRun += 1;
      this.#tasks.set(task.id, {
        ref: task,
        promise,
      });

      return await promise;
    } finally {
      this.#tasks.delete(task.id);
    }
  }

  /**
   * Stop the task manager.
   */
  async stop(): Promise<void> {
    this.#stopping = true;
    log.info('[Manager] stopping...');

    // We wait for all tasks to finish before closing
    const promises: Array<Promise<void>> = [];
    this.#tasks.forEach((task) => {
      promises.push(this.#removeTask(task.ref.id));
    });
    await Promise.all(promises);

    this.#tasks.clear();

    if (this.#chromium) {
      await this.#chromium.stop();
      this.#chromium = null;
    }
    if (this.#firefox) {
      await this.#firefox.stop();
      this.#firefox = null;
    }
  }

  /**
   * Actual execution of a task.
   * It will create a browser, a page, launch the task (render, login), close everything.
   * Any unexpected error will be thrown.
   */
  async #exec(task: Task): Promise<TaskFinal> {
    if (this.#stopping) {
      throw new Error('Task can not be executed: stopping');
    }

    const engine: BrowserEngine = task.params.browser || 'chromium';
    const browser = engine === 'firefox' ? this.#firefox : this.#chromium;
    if (!browser || !browser.isReady) {
      throw new Error('Task can not be executed: no_browser');
    }

    const id = task.id;
    const url = task.params.url.href;
    const type = task.constructor.name;
    log.info('Processing', { id, url, type });

    const start = Date.now();

    try {
      await task.createContext(browser);
      await task.process();
    } catch (err: any) {
      /* eslint-disable no-param-reassign */
      if (!(err instanceof ErrorIsHandledError)) {
        task.results.error = task.results.error || cleanErrorMessage(err);
        task.results.rawError = err;
        report(err, { url }, [
          {
            key: RENDERSCRIPT_TASK_URL_TAG,
            value: url,
          },
          {
            key: RENDERSCRIPT_TASK_TYPE_TAG,
            value: type,
          },
        ]);
      }
      /* eslint-enable no-param-reassign */
    }

    try {
      await task.saveMetrics();
    } catch (err: any) {
      // Task itself should never break the whole execution
      report(err, { url });
    }

    // No matter what happen we want to kill everything gracefully
    try {
      await task.close();
      this.#tasks.delete(id);
    } catch (err: any) {
      // Don't let close errors crash the process
      if (err.message && (
          err.message.includes('Target closed') || 
          err.message.includes('Target page, context or browser has been closed') ||
          err.message.includes('Browser has been disconnected'))) {
        // Expected error when browser is already closed
        log.debug('Expected close error', { err: err.message, url });
      } else {
        report(new Error('Error during close'), { err, url });
      }
    }

    // ---- Reporting
    const total = Date.now() - start;
    stats.timing('renderscript.task', total, undefined, { type });

    if (task.metrics.page) {
      const mp = task.metrics.page;
      /* eslint-disable prettier/prettier */
      stats.timing(`renderscript.task.download`, mp.timings.download!);
      stats.histogram(`renderscript.task.requests`, mp.requests.total);
      stats.increment(`renderscript.task.requests.amount`, mp.requests.total);
      stats.histogram(`renderscript.task.blockedRequests`, mp.requests.blocked);
      stats.increment(`renderscript.task.blockedRequests.amount`, mp.requests.blocked);
      stats.increment(`renderscript.task.contentLength.amount`, mp.contentLength.main);
      stats.histogram(`renderscript.task.contentLength`, mp.contentLength.main);
      stats.increment(`renderscript.task.contentLengthTotal.amount`, mp.contentLength.total);
      stats.histogram(`renderscript.task.contentLengthTotal`, mp.contentLength.total);
      /* eslint-enable prettier/prettier */
    }

    log.info(
      { id, url, code: task.results.error, metrics: task.metrics },
      'Done'
    );
    const res = task.results;
    return {
      ...res,
      timeout: task.page?.hasTimeout || false,
      metrics: task.metrics,
    };
  }

  async #removeTask(id: string): Promise<void> {
    const task = this.#tasks.get(id);
    if (!task) {
      throw new Error(`Could not find task: ${id}`);
    }

    try {
      await task.promise;
    } catch (err) {
      //
    }
  }
}
