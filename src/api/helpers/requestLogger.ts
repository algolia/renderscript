import * as express from "express";

export default (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  console.info(`[${req.method}] ${req.url}`);
  next();
};
