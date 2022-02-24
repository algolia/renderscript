import { v4 as uuid } from 'uuid';

import { report } from 'helpers/errorReporting';
import { stats } from 'helpers/stats';

import { Browser } from './browser/Browser';
import { BrowserPage } from './browser/Page';
import { UNHEALTHY_TASK_TTL, WAIT_TIME } from './constants';
import { LoginTask } from './tasks/Login';
import { RenderTask } from './tasks/Render';
import type { Task } from './tasks/Task';
import type { TaskObject, TaskParams, TaskFinal } from './types';

export class TasksManager {
  #browser: Browser | null = null;
  #stopping: boolean = true;
  #tasks: Map<string, TaskObject & { task?: Task }> = new Map();

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

  async task(job: TaskParams): Promise<TaskFinal> {
    if (this.#stopping) {
      throw new Error('Task can not be executed: stopping');
    }
    if (!this.#browser) {
      throw new Error('Task can not be executed: no_browser');
    }
    console.log('Processing:', url, `(${job.type})(${id})`);

    const start = Date.now();
    const id = uuid();
    this.#registerTask(id);

    const jobParam: TaskParams = {
      ...job,
      waitTime: {
        ...WAIT_TIME,
        ...job.waitTime,
      },
    };
    const url = job.url.toString();
    let task: Task | undefined;

    try {
      const page = new BrowserPage();
      await page.create(this.#browser);

      if (jobParam.type === 'login') {
        task = new LoginTask(jobParam, page);
      } else {
        task = new RenderTask(jobParam, page);
      }
      const obj = this.#tasks.get(id)!;
      obj.task = task;

      await page.linkToTask(task);
      obj.taskPromise = task.process().catch((err) => {
        report(err);
      });

      await obj.taskPromise;
      const res = task.results!;

      await task.close();

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
      // --- /done

      console.log('Done', url, `(${id})`);

      return { ...res, metrics };
    } catch (err) {
      console.log('Fail', url, `(${id})`);
      // This error will be reported elsewhere
      throw err;
    } finally {
      console.log('Finally', url, `(${id})`);
      this.#removeTask(id);
    }
  }

  async stop(): Promise<void> {
    this.#stopping = true;
    console.info(`Tasks Manager stopping...`);

    const promises: Array<Promise<void>> = [];
    this.#tasks.forEach(({ taskPromise }) => {
      if (taskPromise) promises.push(taskPromise);
    });
    await Promise.all(promises);
    this.#tasks.clear();

    if (this.#browser) {
      await this.#browser.stop();
      this.#browser = null;
    }
  }

  #registerTask(id: string): void {
    this.#tasks.set(id, { id, createdAt: new Date() });
  }

  async #removeTask(id: string): Promise<void> {
    const task = this.#tasks.get(id);
    if (!task) {
      // Should never happen but never know
      throw new Error(`Could not find task: ${id}`);
    }

    if (task.task) await task.task?.close();

    this.#tasks.delete(id);
  }
}
