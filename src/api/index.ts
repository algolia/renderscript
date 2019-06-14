import * as path from 'path';
import * as http from "http";
import * as express from "express";
import * as bodyParser from "body-parser";

import requestLogger from "api/helpers/requestLogger";

import * as render from "api/routes/render";
import ready from "api/routes/ready";
import healthy from "api/routes/healthy";

import projectRoot from 'helpers/projectRoot';

export default class Api {
  server: http.Server;
  private _app: express.Express;

  constructor() {
    this._app = express();
    this.server = http.createServer(this._app);
  }

  start(port: number) {
    this._setup();
    this._routes();

    this.server.listen(port, () => {
      console.info(`Server started on port ${port}`);
    });
  }

  async stop(cb: () => any) {
    this.server.close(cb);
  }

  private _setup() {
    this._app.disable("x-powered-by");
    this._app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
    this._app.use(requestLogger);
  }

  private _routes() {
    this._app
      .get("/ready", ready)
      .get("/healthy", healthy)
      .get("/render", render.getURLFromQuery, render.validateURL, render.render)
      .post(
        "/render",
        render.getURLFromBody,
        render.validateURL,
        render.renderJSON
      );

    this._app.use(express.static(path.join(projectRoot, '/public')));
  }
}
