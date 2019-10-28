import * as express from "express";
import renderer from "lib/rendererSingleton";

import { badRequest } from "api/helpers/errors";
import buildUrl from 'api/helpers/buildUrl';

const HEADERS_TO_FORWARD = process.env.HEADERS_TO_FORWARD
  ? process.env.HEADERS_TO_FORWARD.split(',')
  : ['Cookie', 'Authorization']

export function getForwardedHeadersFromRequest(req: express.Request) {
  const headersToForward = HEADERS_TO_FORWARD.reduce((partial, headerName) => {
    const name = headerName.toLowerCase();
    if (req.headers[name]) {
      return { ...partial, [name]: req.headers[name] }
    }
    return partial;
  }, {});

  return headersToForward;
}

export function getURLFromQuery(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  // url
  if (req.method === "GET" && !req.query.url) {
    badRequest({ res, message: "Missing URL in query params" });
    return;
  }
  try {
    res.locals.url = buildUrl(decodeURIComponent(req.query.url));
  } catch (e) {
    res.status(400).json({ error: 'invalid_url' });
    return;
  }
  next();
}

export function getURLFromBody(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (req.method === "POST" && !req.body.url) {
    badRequest({ res, message: "Missing URL in body" });
    return;
  }
  try {
    res.locals.url = buildUrl(req.body.url);
  } catch (e) {
    res.status(400).json({ error: 'invalid_url' });
    return;
  }
  next();
}

export function validateURL(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const { url } = res.locals;
  // Prevent browsing the filesystem using Chrome
  if (!["http:", "https:"].includes(url.protocol)) {
    badRequest({ res, message: "Disallowed protocol" });
    return;
  }
  next();
}

export async function render(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const { url } = res.locals;
  const headersToForward = getForwardedHeadersFromRequest(req);

  try {
    const { error, statusCode, body } = await renderer.task({ url, headersToForward });
    if (error) {
      res.status(400).json({ error });
      return;
    }
    res
      .status(statusCode!)
      .header("Content-Type", "text/html")
      // Only whitelist loading styles resources when testing
      // (will not change programmatic use of this system)
      .header(
        "Content-Security-Policy",
        [
          "default-src 'none'",
          "style-src * 'unsafe-inline'",
          "img-src * data:",
          "font-src *"
        ].join("; ")
      )
      .send(body);
  } catch (e) {
    res.status(500).json({
      error: e.message
    });
  }
}

export async function renderJSON(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const { url } = res.locals;
  const headersToForward = getForwardedHeadersFromRequest(req);
  try {
    const { error, statusCode, headers, body, timeout, resolvedUrl } = await renderer.task({ url, headersToForward });
    if (error) {
      res.status(400).json({ error });
      return;
    }
    if (resolvedUrl !== url.href) {
      res.status(307).header('Location', resolvedUrl).send();
      return;
    }
    res.status(200).json({
      statusCode,
      headers,
      body,
      timeout
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
    return;
  }
}
