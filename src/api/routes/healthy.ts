import os from 'os';

import type express from 'express';

import { stats } from 'helpers/stats';
import { tasksManager } from 'lib/singletons';

const hostname = os.hostname();

export function healthy(req: express.Request, res: express.Response): void {
  const isHealthy = tasksManager.healthy;
  const tasksRunning = tasksManager.currentConcurrency;
  const pagesOpen = tasksManager.currentBrowser?.getCurrentConcurrency() || 0;
  const totalRun = tasksManager.totalRun;

  // Those stats could be computed from .task.count
  // But we want to double check that we don't forgot tasks or tabs
  stats.gauge('renderscript.tasks.running', tasksRunning);
  stats.gauge('renderscript.pages.open', pagesOpen);
  stats.check(
    'renderscript.up',
    isHealthy ? stats.CHECKS.OK : stats.CHECKS.CRITICAL,
    {
      hostname,
    }
  );

  res
    .status(isHealthy ? 200 : 503)
    .json({ ready: isHealthy, tasksRunning, pagesOpen, totalRun });
}
