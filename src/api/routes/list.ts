import type express from 'express';

import { tasksManager } from 'lib/singletons';

/**
 * List currently opened page.
 * Useful to debug non-killed page.
 */
export async function list(
  req: express.Request,
  res: express.Response
): Promise<void> {
  const open = tasksManager.currentBrowser
    ? (await tasksManager.currentBrowser.instance!.pages()).map((page) => {
        return page.url();
      })
    : [];

  res.status(200).json({ open });
}
