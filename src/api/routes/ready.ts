import * as express from "express";
import renderer from "lib/rendererSingleton";

export default async function ready(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const isReady = await renderer.ready;
  res.status(isReady ? 200 : 503).send();
}
