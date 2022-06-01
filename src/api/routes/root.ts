import type express from 'express';

import type { GetRoot } from '../@types/GetRoot';

export function root(
  req: express.Request,
  res: express.Response<GetRoot>
): void {
  res.status(200).json({ version: process.env.VERSION || 'dev' });
}
