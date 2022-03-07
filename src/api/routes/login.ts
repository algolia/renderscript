import type express from 'express';

import type { PostLoginParams, PostLoginResponse } from 'api/@types/postLogin';
import { CSP_HEADERS } from 'api/constants';
import { getDefaultParams, alt } from 'api/helpers/alt';
import { badRequest } from 'api/helpers/errors';
import { getForwardedHeadersFromRequest } from 'api/helpers/getForwardedHeaders';
import { report } from 'helpers/errorReporting';
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
  const { url, ua, username, password, renderHTML, waitTime } = req.body;
  const headersToForward = getForwardedHeadersFromRequest(req);

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

    res.status(200).json({
      headers: task.headers,
      metrics: task.metrics,
      statusCode: task.statusCode,
      timeout: task.timeout,
      error: task.error,
      cookies: task.cookies,
      resolvedUrl: task.resolvedUrl,
      body: task.body,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
    report(err, { url, type: 'login' });
  }
}
