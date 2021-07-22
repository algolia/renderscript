import type express from 'express';

import { tasksManager } from 'lib/tasksManagerSingleton';

export function healthy(req: express.Request, res: express.Response): void {
  const isHealthy = tasksManager.healthy;
  res.status(isHealthy ? 200 : 503).send();
}
