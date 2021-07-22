import type express from 'express';

import { CSP_HEADERS } from 'api/constants';
import { getDefaultParams, alt } from 'api/helpers/alt';
import { revertUrl } from 'api/helpers/buildUrl';
import { badRequest } from 'api/helpers/errors';
import { getForwardedHeadersFromRequest } from 'api/helpers/getForwardedHeaders';
import renderer from 'lib/rendererSingleton';

export async function validate(
  req: express.Request,
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
  req: express.Request<any, any, any, { url: string; ua: string }>,
  res: express.Response
): Promise<void> {
  const { url: rawUrl, ua } = req.query;
  const headersToForward = getForwardedHeadersFromRequest(req);
  const url = new URL(rawUrl);

  try {
    const { error, statusCode, body, resolvedUrl } = await renderer.task({
      type: 'render',
      url,
      headersToForward,
      userAgent: ua,
    });
    if (error) {
      res.status(400).json({ error });
      return;
    }
    if (resolvedUrl && resolvedUrl !== url.href) {
      const location = revertUrl(resolvedUrl).href;
      res.status(307).header('Location', location).send();
      return;
    }
    res
      .status(statusCode!)
      .header('Content-Type', 'text/html')
      .header('Content-Security-Policy', CSP_HEADERS)
      .send(body);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
}

export async function renderJSON(
  req: express.Request<any, any, any, { url: string; ua: string }>,
  res: express.Response
): Promise<void> {
  const { url: rawUrl, ua } = req.query;
  const headersToForward = getForwardedHeadersFromRequest(req);
  const url = new URL(rawUrl);

  try {
    const { error, statusCode, headers, body, timeout, resolvedUrl, metrics } =
      await renderer.task({
        type: 'render',
        url,
        headersToForward,
        userAgent: ua,
      });

    if (error) {
      res.status(400).json({ error });
      return;
    }

    if (resolvedUrl && resolvedUrl !== url.href) {
      const location = revertUrl(resolvedUrl).href;
      res.status(307).header('Location', location).send();
      return;
    }

    res.status(200).json({
      statusCode,
      metrics,
      headers,
      body,
      timeout,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
