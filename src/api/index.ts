import * as http from 'http';
import * as path from 'path';

import { urlencoded } from 'body-parser';
import express, { static as expressStatic } from 'express';

import requestLogger from 'api/helpers/requestLogger';
import healthy from 'api/routes/healthy';
import ready from 'api/routes/ready';
import * as render from 'api/routes/render';
import projectRoot from 'helpers/projectRoot';

export default class Api {
  server: http.Server;
  private _app: express.Express;

  constructor() {
    this._app = express();
    this.server = http.createServer(this._app);
  }

  start(port: number): void {
    this._setup();
    this._routes();

    this.server.listen(port, () => {
      console.info(`Server started on port ${port}`);
    });
  }

  stop(cb: () => any): void {
    this.server.close(cb);
  }

  private _setup(): void {
    this._app.disable('x-powered-by');
    this._app.use(urlencoded({ limit: '10mb', extended: true }));
    this._app.use(requestLogger);
  }

  private _routes(): void {
    this._app
      .get('/ready', ready)
      .get('/healthy', healthy)
      .get('/render', render.getURLFromQuery, render.validateURL, render.render)
      .post(
        '/render',
        render.getURLFromBody,
        render.validateURL,
        render.renderJSON
      )
      .post(
        '/login',
        render.getURLFromBody,
        render.validateURL,
        render.processLogin
      );

    this._app.use(expressStatic(path.join(projectRoot, '/public')));
  }
}
