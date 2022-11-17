import type express from 'express';

import type { PostLoginParams, PostLoginResponse } from 'api/@types/postLogin';
import { CSP_HEADERS } from 'api/constants';
import { getDefaultParams, alt } from 'api/helpers/alt';
import { buildUrl, revertUrl } from 'api/helpers/buildUrl';
import { badRequest } from 'api/helpers/errors';
import { getForwardedHeadersFromRequest } from 'api/helpers/getForwardedHeaders';
import { report } from 'helpers/errorReporting';
import { retryableErrors } from 'lib/helpers/errors';
import { tasksManager } from 'lib/singletons';
import { LoginTask } from 'lib/tasks/Login';

export async function validate(
  req: express.Request<any, any, PostLoginParams>,
  res: express.Response,
  next: express.NextFunction
): Promise<void> {
  const errors = await alt({
    ...getDefaultParams(),
    username: alt.string().required(),
    password: alt.string().required(),
    renderHTML: alt.boolean().cast(),
  })
    .body(req.body)
    .validate();

  if (errors) {
    badRequest({ res, details: errors });
    return;
  }

  next();
}

export async function processLogin(
  req: express.Request<any, any, PostLoginParams>,
  res: express.Response<PostLoginResponse | string | null>
): Promise<void> {
  const { ua, username, password, renderHTML, waitTime, browser } = req.body;
  const headersToForward = getForwardedHeadersFromRequest(req);
  const url = new URL(buildUrl(req.body.url));

  try {
    const task = await tasksManager.task(
      new LoginTask({
        url: new URL(url),
        headersToForward,
        userAgent: ua,
        login: {
          username,
          password,
        },
        browser,
        renderHTML,
        waitTime,
      })
    );

    if (renderHTML) {
      res
        .status(200)
        .header('Content-Type', 'text/html')
        .header('Content-Security-Policy', CSP_HEADERS)
        .send(task.body);
      return;
    }

    const resolvedUrl = revertUrl(task.resolvedUrl)?.href || null;
    const code = task.error && retryableErrors.includes(task.error) ? 500 : 200;

    res.status(code).json({
      headers: task.headers,
      metrics: task.metrics,
      statusCode: task.statusCode,
      timeout: task.timeout,
      error: task.error,
      cookies: task.cookies,
      resolvedUrl,
      body: task.body,
      rawError: task.rawError
        ? {
            message: task.rawError.message,
            stack: task.rawError.stack,
          }
        : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
    report(err, { url, type: 'login' });
  }
}
