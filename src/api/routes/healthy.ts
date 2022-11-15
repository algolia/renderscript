import os from 'os';

import type express from 'express';

import type { GetHealthySuccess } from 'api/@types/getHealthy';
import { report } from 'helpers/errorReporting';
import { stats } from 'helpers/stats';
import { UNHEALTHY_TASK_TTL } from 'lib/constants';
import { tasksManager } from 'lib/singletons';

const hostname = os.hostname();

export function healthy(
  req: express.Request,
  res: express.Response<GetHealthySuccess>
): void {
  const health = tasksManager.getHealth();
  const tasksRunning = tasksManager.currentConcurrency;
  let pagesOpen = 0;
  tasksManager.currentBrowsers.forEach((browser) => {
    pagesOpen += browser?.getCurrentConcurrency() || 0;
  });
  const totalRun = tasksManager.totalRun;

  // Those stats could be computed from .task.count
  // But we want to double check that we don't forgot tasks or tabs
  stats.gauge('renderscript.tasks.running', tasksRunning);
  stats.gauge('renderscript.pages.open', pagesOpen);
  stats.check(
    'renderscript.up',
    health.ready ? stats.CHECKS.OK : stats.CHECKS.CRITICAL,
    {
      hostname,
    }
  );

  if (!health.ready && health.oldTasks.length > 0) {
    report(new Error('Reporting not healthy'), {
      tasks: health.oldTasks,
      max: UNHEALTHY_TASK_TTL,
      tasksRunning,
      pagesOpen,
      totalRun,
    });
  }

  res
    .status(health.ready ? 200 : 503)
    .json({ ready: health.ready, tasksRunning, pagesOpen, totalRun });
}
