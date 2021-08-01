import { TasksManager } from './TasksManager';
import { Adblocker } from './browser/Adblocker';

export const tasksManager = new TasksManager();
tasksManager.launch();

export const adblocker = new Adblocker();
adblocker.load();
