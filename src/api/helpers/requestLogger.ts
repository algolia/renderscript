import type express from 'express';

import { log } from './logger';

export function requestLogger(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  if (['/ready', '/healthy'].includes(req.url)) {
    next();
    return;
  }

  log.info('Received', { method: req.method, path: req.url });
  next();
}
