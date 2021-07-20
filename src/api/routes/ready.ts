import type express from 'express';

import { isReady } from 'lib/helpers/isReady';

export function ready(req: express.Request, res: express.Response): void {
  res.status(isReady() ? 200 : 503).send();
}
