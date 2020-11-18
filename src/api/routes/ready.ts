import * as express from 'express';
import isReady from 'lib/helpers/isReady';

export default async function ready(
  req: express.Request,
  res: express.Response
) {
  res.status((await isReady()) ? 200 : 503).send();
}
