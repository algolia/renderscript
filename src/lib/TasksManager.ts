import { v4 as uuid } from 'uuid';

import { stats } from 'helpers/stats';

import { Browser } from './browser/Browser';
import { BrowserPage } from './browser/Page';
import { WAIT_TIME } from './constants';
import { LoginTask } from './tasks/Login';
import { RenderTask } from './tasks/Render';
import type { Task } from './tasks/Task';
import type { TaskObject, TaskParams, TaskFinal } from './types';

export class TasksManager {
  #browser: Browser | null;
  #stopping: boolean;
  #currentTasks: TaskObject[] = [];

  constructor() {
    this.#browser = null;
    this.#stopping = true;
    this.#currentTasks = [];
  }

  get healthy(): boolean {
    if (this.#stopping) {
      return false;
    }

    if (this.#browser) {
      return this.#browser.isReady;
    }
    return false;
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
    const jobParam: TaskParams = {
      ...job,
      waitTime: {
        ...WAIT_TIME,
        ...job.waitTime,
      },
    };
    console.log('Processing:', job.url.toString(), `(${job.type})`);

    const id = uuid();

    const page = new BrowserPage();
    await page.create(this.#browser);

    let task: Task;
    if (jobParam.type === 'login') {
      task = new LoginTask(jobParam, page);
    } else {
      task = new RenderTask(jobParam, page);
    }

    await page.linkToTask(task);
    const taskPromise = task.process().catch((err) => {
      console.error(err);
    });
    this.#addTask({ id, taskPromise });

    await taskPromise;
    const res = task.results!;

    this.#removeTask({ id });

    stats.timing('renderscript.task', Date.now() - start, undefined, {
      type: job.type,
    });
    console.log('Done', job.url.toString());

    return { ...res, metrics: task.metrics };
  }

  async stop(): Promise<void> {
    this.#stopping = true;
    console.info(`Tasks Manager stopping...`);

    await Promise.all(this.#currentTasks.map(({ taskPromise }) => taskPromise));

    if (this.#browser) {
      await this.#browser.stop();
    }
  }

  #addTask({ id, taskPromise }: TaskObject): void {
    this.#currentTasks.push({ id, taskPromise });
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
