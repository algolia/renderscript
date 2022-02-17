import { TasksManager } from './TasksManager';
import { Adblocker } from './browser/Adblocker';

export const tasksManager = new TasksManager();
tasksManager.launch().catch((err) => {
  console.error('Error during launch', err);

  // eslint-disable-next-line no-process-exit
  process.exit(1);
});

export const adblocker = new Adblocker();
adblocker.load();
