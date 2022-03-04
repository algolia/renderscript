import type express from 'express';

import { tasksManager } from 'lib/singletons';

/**
 * List currently opened page.
 * Useful to debug non-killed page.
 */
export function list(req: express.Request, res: express.Response): void {
  const open: string[] = [];
  if (tasksManager.currentBrowser) {
    tasksManager.currentBrowser.instance!.contexts().forEach((ctx) => {
      ctx.pages().forEach((page) => {
        open.push(page.url());
      });
    });
  }

  res.status(200).json({ open });
}
