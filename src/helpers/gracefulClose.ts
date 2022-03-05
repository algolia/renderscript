import type { Api } from 'api/index';
import type { TasksManager } from 'lib/TasksManager';

import * as reporting from './errorReporting';
import { log } from './logger';
import * as stats from './stats';

interface Params {
  api: Api;
  tasksManager: TasksManager;
}

let gracefullyClosing = false;

async function close({ api, tasksManager }: Params): Promise<void> {
  const webServerPromise = new Promise<void>((resolve) => {
    log.info('[API] Stopping...');
    api.stop(() => {
      log.info('[API] stopped');
      resolve();
    });
  });

  await webServerPromise;
  await tasksManager.stop();

  log.info('Gracefully stopped everything');
}

export async function gracefulClose(opts: Params): Promise<void> {
  // If we receive multiple signals, swallow them
  if (gracefullyClosing) {
    return;
  }

  gracefullyClosing = true;
  log.info('Starting graceful close...');

  try {
    await close(opts);
    await reporting.drain();
    await stats.close();
  } catch (err) {
    log.error('Graceful exit failed', err);
  }
  log.flush();

  // eslint-disable-next-line no-process-exit
  process.exit(0);
}
