import type express from 'express';

import { tasksManager } from 'lib/singletons';

export function ready(req: express.Request, res: express.Response): void {
  const isHealthy = tasksManager.healthy;
  res.status(isHealthy ? 200 : 503).json({ ready: isHealthy });
}
