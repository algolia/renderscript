import * as express from "express";
import renderer from "lib/rendererSingleton";

import { badRequest } from "api/helpers/errors";

export function validateRender(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  // url
  if (req.method === "POST" && !req.body.url) {
    badRequest({ res, message: "Missing URL in body" });
    return;
  }
  if (req.method === "GET" && !req.query.url) {
    badRequest({ res, message: "Missing URL in query params" });
    return;
  }
  const rawUrl = decodeURIComponent(req.query.url) || req.body.url;
  const url = new URL(rawUrl);
  res.locals.url = url;

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
  const { statusCode, headers, content } = await renderer.task({ url });
  res
    .status(200)
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
    .header("x-renderscript-status-code", String(statusCode))
    .header("x-renderscript-headers", JSON.stringify(headers))
    .send(content);
}
