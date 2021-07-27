import { v4 as uuid } from 'uuid';

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
  #currentTasks: TaskObject[] = [];

  get healthy(): boolean {
    if (this.#stopping) {
      return false;
    }

    // Tasks lifecycle
    const lostTask = this.#currentTasks.some((task) => {
      return Date.now() - task.createdAt.getTime() > UNHEALTHY_TASK_TTL;
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
    return this.#currentTasks.length;
  }

  async launch(): Promise<void> {
    const browser = new Browser();
    await browser.create();
    this.#browser = browser;
    this.#stopping = false;
  }

  async task(job: TaskParams): Promise<TaskFinal> {
    if (this.#stopping || !this.#browser) {
      throw new Error('Called task on a stopping Manager');
    }

    const start = Date.now();
    const id = uuid();
    const jobParam: TaskParams = {
      ...job,
      waitTime: {
        ...WAIT_TIME,
        ...job.waitTime,
      },
    };
    const url = job.url.toString();
    let task: Task | undefined;

    console.log('Processing:', url, `(${job.type})(${id})`);
    try {
      const page = new BrowserPage();
      await page.create(this.#browser);

      if (jobParam.type === 'login') {
        task = new LoginTask(jobParam, page);
      } else {
        task = new RenderTask(jobParam, page);
      }

      await page.linkToTask(task);
      const taskPromise = task.process().catch((err) => {
        // TO DO: log to sentry
        console.error(err);
      });
      this.#addTask({ id, taskPromise });

      await taskPromise;
      const res = task.results!;

      this.#removeTask({ id });
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

      task = undefined;

      return { ...res, metrics };
    } catch (e) {
      console.log('Fail', url, `(${id})`);
      throw e;
    } finally {
      if (task) {
        this.#removeTask({ id });
        task.close();
      }
    }
  }

  async stop(): Promise<void> {
    this.#stopping = true;
    console.info(`Tasks Manager stopping...`);

    await Promise.all(this.#currentTasks.map(({ taskPromise }) => taskPromise));

    if (this.#browser) {
      await this.#browser.stop();
      this.#browser = null;
    }
  }

  #addTask({ id, taskPromise }: Pick<TaskObject, 'id' | 'taskPromise'>): void {
    this.#currentTasks.push({ id, taskPromise, createdAt: new Date() });
  }

  #removeTask({ id }: Pick<TaskObject, 'id'>): void {
    const idx = this.#currentTasks.findIndex(({ id: _id }) => id === _id);

    // Should never happen
    if (idx === -1) {
      throw new Error('Could not find task');
    }

    this.#currentTasks.splice(idx, 1);
  }
}
