import type express from 'express';

export function requestLogger(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  if (['/ready', '/healthy'].includes(req.url)) {
    next();
    return;
  }

  console.info(`[${req.method}] ${req.url}`);
  next();
}
