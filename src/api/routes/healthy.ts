import type express from 'express';

import { stats } from 'helpers/stats';
import { tasksManager } from 'lib/tasksManagerSingleton';

export async function healthy(
  req: express.Request,
  res: express.Response
): Promise<void> {
  const isHealthy = tasksManager.healthy;
  const tasksRunning = tasksManager.currentConcurrency;
  const pagesOpened = tasksManager.currentBrowser
    ? await tasksManager.currentBrowser.getCurrentConcurrency()
    : -1;

  // Those stats could be computed from .task.count
  // But we want to double check that we don't forgot tasks or tabs
  stats.gauge('renderscript.tasks.running', tasksRunning);
  stats.gauge('renderscript.pages.opened', pagesOpened);

  res
    .status(isHealthy ? 200 : 503)
    .json({ ready: isHealthy, tasksRunning, pagesOpened });
}
