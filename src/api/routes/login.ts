import type express from 'express';

import { CSP_HEADERS } from 'api/constants';
import { getDefaultParams, alt } from 'api/helpers/alt';
import { badRequest } from 'api/helpers/errors';
import { getForwardedHeadersFromRequest } from 'api/helpers/getForwardedHeaders';
import { tasksManager } from 'lib/singletons';

export async function validate(
  req: express.Request,
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
  req: express.Request<
    any,
    any,
    {
      url: string;
      ua: string;
      username: string;
      password: string;
      renderHTML?: boolean;
    }
  >,
  res: express.Response
): Promise<void> {
  const { url, ua, username, password, renderHTML } = req.body;
  const headersToForward = getForwardedHeadersFromRequest(req);

  try {
    const { error, statusCode, headers, body, cookies, timeout } =
      await tasksManager.task({
        type: 'login',
        url: new URL(url),
        headersToForward,
        userAgent: ua,
        login: {
          username,
          password,
        },
      });

    if (error) {
      if (renderHTML) {
        res
          .status(200)
          .header('Content-Type', 'text/html')
          .header('Content-Security-Policy', CSP_HEADERS)
          .send(body);
        return;
      }
      res.status(400).json({ error });
      return;
    }

    if (renderHTML) {
      res
        .status(statusCode!)
        .header('Content-Type', 'text/html')
        .header('Content-Security-Policy', CSP_HEADERS)
        .send(body);
      return;
    }
    res.status(200).json({
      statusCode,
      headers,
      cookies,
      timeout,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
