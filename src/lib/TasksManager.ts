import { v4 as uuid } from 'uuid';

import { report } from 'helpers/errorReporting';
import { stats } from 'helpers/stats';
import { wait } from 'helpers/wait';

import { Browser } from './browser/Browser';
import { BrowserPage } from './browser/Page';
import {
  MAX_WAIT_FOR_NEW_PAGE,
  UNHEALTHY_TASK_TTL,
  WAIT_TIME,
} from './constants';
import { LoginTask } from './tasks/Login';
import { RenderTask } from './tasks/Render';
import type { Task } from './tasks/Task';
import type { TaskObject, TaskParams, TaskFinal } from './types';

export class TasksManager {
  #browser: Browser | null = null;
  #stopping: boolean = true;
  #tasks: Map<string, TaskObject & { execPromise: Promise<TaskFinal> }> =
    new Map();

  get healthy(): boolean {
    if (this.#stopping) {
      return false;
    }

    // Tasks lifecycle
    let lostTask = 0;
    this.#tasks.forEach((task) => {
      if (Date.now() - task.createdAt.getTime() > UNHEALTHY_TASK_TTL) {
        lostTask += 1;
      }
    });
    if (lostTask) {
      report(new Error('Many lost tasks'), { lostTask });
      return false;
    }

    if (this.#browser) {
      return this.#browser.isReady;
    }

    return false;
  }

  get currentBrowser(): Browser | null {
    return this.#browser;
  }

  get currentConcurrency(): number {
    return this.#tasks.size;
  }

  async launch(): Promise<void> {
    const browser = new Browser();
    await browser.create();
    this.#browser = browser;
    this.#stopping = false;
  }

  /**
   * Register and execute a task.
   */
  async task(job: TaskParams): Promise<TaskFinal> {
    const id = uuid();

    const task = this.#exec(id, job);
    this.#tasks.set(id, { id, createdAt: new Date(), execPromise: task });
    return await task;
  }

  /**
   * Actual execution of a task.
   * It will create a browser, a page, launch the task (render, login), close everything.
   * Any unexpected error will be thrown.
   */
  async #exec(id: string, job: TaskParams): Promise<TaskFinal> {
    if (this.#stopping) {
      throw new Error('Task can not be executed: stopping');
    }
    if (!this.#browser) {
      throw new Error('Task can not be executed: no_browser');
    }

    const url = job.url.toString();
    console.log('Processing:', url, `(${job.type})(${id})`);

    const start = Date.now();

    const jobParam: TaskParams = {
      ...job,
      waitTime: {
        ...WAIT_TIME,
        ...job.waitTime,
      },
    };
    let task: Task | undefined;

    try {
      console.debug(id, 'create page');
      const page = new BrowserPage();

      // It seems page creation can hang infinitely in puppeteer
      // so we want it fail as soon as possible to retry on an other pod
      await Promise.race([
        page.create(this.#browser),
        (async (): Promise<void> => {
          await wait(MAX_WAIT_FOR_NEW_PAGE);

          console.debug(id, 'Can not create a BrowserPage');

          // Stopping has we can not trust puppeteer
          // Health check will collect the rest of this container
          this.stop();
          throw new Error('Can not create a BrowserPage');
        })(),
      ]);

      console.debug(id, 'page created');

      if (jobParam.type === 'login') {
        task = new LoginTask(jobParam, page);
      } else {
        task = new RenderTask(jobParam, page);
      }

      console.debug(id, 'linking task');
      await page.linkToTask(task);

      try {
        console.debug(id, 'waiting task');
        await task.process();
      } catch (err: any) {
        // Task itself should never break the whole execution
        report(err, { jobParam });
      }

      // Required to get metrics
      await task.saveMetrics();
    } catch (err) {
      console.log('Fail', url, `(${id})`);
      // This error will be reported elsewhere
      throw err;
    } finally {
      console.log('Finally', url, `(${id})`);

      // No matter what happen we want to kill everything gracefully
      try {
        if (task) {
          await task.close();
        }
        this.#tasks.delete(id);
      } catch (err) {
        report(new Error('Error during close'), { err, jobParam });
      }
    }

    // ---- Reporting
    stats.timing('renderscript.task', Date.now() - start, undefined, {
      type: job.type,
    });
    const metrics = task.metrics;

    if (metrics.page) {
      Object.entries(metrics.page).forEach(([key, value]) => {
        if (key.endsWith('Duration')) {
          stats.timing(`renderscript.task.${key}`, value);
          return;
        }

        stats.histogram(`renderscript.task.${key}`, value);
        stats.increment(`renderscript.task.${key}.amount`, value);
      });
    }
    // --- /reporting

    console.log('Done', url, `(${id})`);

    const res = task.results!;
    return { ...res, metrics };
  }

  /**
   * Stop the task manager.
   */
  async stop(): Promise<void> {
    this.#stopping = true;
    console.info(`Tasks Manager stopping...`);

    // We wait for all tasks to finish before closing
    const promises: Array<Promise<void>> = [];
    this.#tasks.forEach((task) => {
      promises.push(this.#removeTask(task.id));
    });
    await Promise.all(promises);

    this.#tasks.clear();

    if (this.#browser) {
      await this.#browser.stop();
      this.#browser = null;
    }
  }

  async #removeTask(id: string): Promise<void> {
    const task = this.#tasks.get(id);
    if (!task) {
      throw new Error(`Could not find task: ${id}`);
    }

    try {
      if (task.execPromise) {
        await task.execPromise;
      }
    } catch (err) {
      //
    }
  }
}
