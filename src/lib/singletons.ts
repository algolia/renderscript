import { report } from 'helpers/errorReporting';

import { TasksManager } from './TasksManager';
import { Adblocker } from './browser/Adblocker';

export const tasksManager = new TasksManager();
tasksManager.launch().catch((err) => {
  report(new Error('Error during launch'), { err });

  console.log('Exit');
  setTimeout(() => {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }, 1);
});

export const adblocker = new Adblocker();
adblocker.load();
