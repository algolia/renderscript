import type express from 'express';

import { CSP_HEADERS, HEADERS_TO_FORWARD } from 'api/constants';
import { revertUrl, buildUrl } from 'api/helpers/buildUrl';
import { badRequest } from 'api/helpers/errors';
import renderer from 'lib/rendererSingleton';

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

export function getParamsFromBody(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const { url, ua, username, password } = req.body;
  if (req.method === 'POST' && !url) {
    badRequest({ res, message: 'Missing URL in body' });
    return;
  }
  if (!ua) {
    badRequest({ res, message: 'Missing User-Agent' });
    return;
  }
  if (req.path === '/login') {
    if (!username) {
      badRequest({ res, message: 'Missing username' });
      return;
    }
    if (!password) {
      badRequest({ res, message: 'Missing password' });
      return;
    }
  }

  try {
    res.locals.url = buildUrl(url);
  } catch (e) {
    res.status(400).json({ error: 'invalid_url' });
    return;
  }
  res.locals.ua = ua;
  res.locals.username = username;
  res.locals.password = password;
  res.locals.renderHTML = Boolean(req.body.renderHTML);
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
  req: express.Request,
  res: express.Response
): Promise<void> {
  const { url, ua } = res.locals;
  const headersToForward = getForwardedHeadersFromRequest(req);
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

export async function processLogin(
  req: express.Request,
  res: express.Response
): Promise<void> {
  const { url, ua, username, password, renderHTML } = res.locals;
  const headersToForward = getForwardedHeadersFromRequest(req);
  try {
    const { error, statusCode, headers, body, cookies, timeout } =
      await renderer.task({
        type: 'login',
        url,
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
