import * as express from "express";
import renderer from "lib/rendererSingleton";

export async function isReady() {
  return await renderer.ready;
}

export default async function ready(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  res.status((await isReady()) ? 200 : 503).send();
}
