import { report } from '../helpers/errorReporting';
import { log } from '../helpers/logger';

import { TasksManager } from './TasksManager';
import { Adblocker } from './browser/Adblocker';

export const tasksManager = new TasksManager();
export const adblocker = new Adblocker();

export async function init(): Promise<void> {
  try {
    await tasksManager.launch();
    await adblocker.load();
  } catch (err: any) {
    report(new Error('Error during launch'), { err });

    log.info('Exit');
    setTimeout(() => {
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }, 1);
  }
}
