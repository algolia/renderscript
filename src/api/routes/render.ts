import type express from 'express';

import { revertUrl, buildUrl } from 'api/helpers/buildUrl';
import { badRequest } from 'api/helpers/errors';
import renderer from 'lib/rendererSingleton';

const HEADERS_TO_FORWARD = process.env.HEADERS_TO_FORWARD
  ? process.env.HEADERS_TO_FORWARD.split(',')
  : ['Cookie', 'Authorization'];

export function getForwardedHeadersFromRequest(
  req: express.Request
): Record<string, string> {
  const headersToForward = HEADERS_TO_FORWARD.reduce((partial, headerName) => {
    const name = headerName.toLowerCase();
    if (req.headers[name]) {
      return { ...partial, [name]: req.headers[name] };
    }
    return partial;
  }, {});

  return headersToForward;
}

export function getURLFromQuery(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const { url, ua } = req.query;
  if (!url) {
    badRequest({ res, message: 'Missing URL in query params' });
    return;
  }
  if (!ua) {
    badRequest({ res, message: 'Missing User-Agent' });
    return;
  }

  try {
    res.locals.url = buildUrl(decodeURIComponent(url as any));
  } catch (e) {
    res.status(400).json({ error: 'invalid_url' });
    return;
  }
  res.locals.ua = ua;

  next();
}

export function getURLFromBody(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const { url, ua } = req.body;
  if (req.method === 'POST' && !url) {
    badRequest({ res, message: 'Missing URL in body' });
    return;
  }
  if (!ua) {
    badRequest({ res, message: 'Missing User-Agent' });
    return;
  }

  try {
    res.locals.url = buildUrl(url);
  } catch (e) {
    res.status(400).json({ error: 'invalid_url' });
    return;
  }
  res.locals.ua = ua;
  next();
}

export function validateURL(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const { url } = res.locals;
  // Prevent browsing the filesystem using Chrome
  if (!['http:', 'https:'].includes(url.protocol)) {
    badRequest({ res, message: 'Disallowed protocol' });
    return;
  }
  next();
}

export async function render(
  req: express.Request,
  res: express.Response
): Promise<void> {
  const { url, ua } = res.locals;

  const headersToForward = getForwardedHeadersFromRequest(req);

  try {
    const { error, statusCode, body, resolvedUrl } = await renderer.task({
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
      // Only whitelist loading styles resources when testing
      // (will not change programmatic use of this system)
      .header(
        'Content-Security-Policy',
        [
          "default-src 'none'",
          "style-src * 'unsafe-inline'",
          'img-src * data:',
          'font-src *',
        ].join('; ')
      )
      .send(body);
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
}

export async function renderJSON(
  req: express.Request,
  res: express.Response
): Promise<void> {
  const { url, ua } = res.locals;
  const headersToForward = getForwardedHeadersFromRequest(req);
  try {
    const {
      error,
      statusCode,
      headers,
      body,
      timeout,
      resolvedUrl,
    } = await renderer.task({ url, headersToForward, userAgent: ua });

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
      headers,
      body,
      timeout,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
