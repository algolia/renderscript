import type express from 'express';

import type {
  PostRenderParams,
  PostRenderResponse,
} from 'api/@types/postRender';
import type { Res500 } from 'api/@types/responses';
import { CSP_HEADERS } from 'api/constants';
import { getDefaultParams, alt } from 'api/helpers/alt';
import { buildUrl, revertUrl } from 'api/helpers/buildUrl';
import { badRequest } from 'api/helpers/errors';
import { getForwardedHeadersFromRequest } from 'api/helpers/getForwardedHeaders';
import { report } from 'helpers/errorReporting';
import { retryableErrors } from 'lib/helpers/errors';
import { tasksManager } from 'lib/singletons';
import { RenderTask } from 'lib/tasks/Render';

export async function validate(
  req: express.Request<any, any, any, any>,
  res: express.Response,
  next: express.NextFunction
): Promise<void> {
  const errors = await alt(getDefaultParams())
    .body(req.method === 'GET' ? req.query : req.body)
    .validate();

  if (errors) {
    badRequest({ res, details: errors });
    return;
  }

  next();
}

export async function render(
  req: express.Request<any, any, any, PostRenderParams>,
  res: express.Response<Res500 | string | null>
): Promise<void> {
  const { url: rawUrl, ua, waitTime, adblock } = req.query;
  const headersToForward = getForwardedHeadersFromRequest(req);
  const url = new URL(buildUrl(rawUrl));

  try {
    const { error, statusCode, body, resolvedUrl } = await tasksManager.task(
      new RenderTask({
        url,
        headersToForward,
        userAgent: ua,
        waitTime,
        adblock,
      })
    );

    if (resolvedUrl && resolvedUrl !== url.href) {
      const location = revertUrl(resolvedUrl)?.href || url.href;
      res.status(307).header('Location', location).send();
      return;
    }

    if (error) {
      res.status(400).json({ error });
      return;
    }

    res
      .status(statusCode!)
      .header('Content-Type', 'text/html')
      .header('Content-Security-Policy', CSP_HEADERS)
      .send(body);
  } catch (err: any) {
    res.status(500).json({
      error: err.message,
    });
    report(err, { type: 'render', url: rawUrl });
  }
}

export async function renderJSON(
  req: express.Request<any, any, PostRenderParams>,
  res: express.Response<PostRenderResponse>
): Promise<void> {
  const { url: rawUrl, ua, waitTime, adblock } = req.body;
  const headersToForward = getForwardedHeadersFromRequest(req);
  const url = new URL(buildUrl(rawUrl));

  try {
    const task = await tasksManager.task(
      new RenderTask({
        url,
        headersToForward,
        userAgent: ua,
        waitTime,
        adblock,
      })
    );

    const resolvedUrl = revertUrl(task.resolvedUrl)?.href || null;
    const code = task.error && retryableErrors.includes(task.error) ? 500 : 200;
    res.status(code).json({
      body: task.body,
      headers: task.headers,
      metrics: task.metrics,
      resolvedUrl,
      statusCode: task.statusCode,
      timeout: task.timeout,
      error: task.error,
      rawError: task.rawError
        ? {
            message: task.rawError.message,
            stack: task.rawError.stack,
          }
        : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
    report(err, { type: 'renderJSON', url: rawUrl });
  }
}
