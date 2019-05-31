import * as express from "express";
import renderer from "lib/rendererSingleton";

export default async function healthy(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const isHealthy = renderer.ready && (await renderer.healthy());
  res.status(isHealthy ? 200 : 503).send();
}
