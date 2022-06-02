import * as http from 'http';
import * as path from 'path';

import { urlencoded, json } from 'body-parser';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import express, { static as expressStatic } from 'express';

import { requestLogger } from 'api/helpers/requestLogger';
import { healthy } from 'api/routes/healthy';
import * as routeLogin from 'api/routes/login';
import { ready } from 'api/routes/ready';
import * as routeRender from 'api/routes/render';
import projectRoot from 'helpers/projectRoot';

import { log } from './helpers/logger';
import { list } from './routes/list';
import {
  getLogin,
  getStep1,
  getTest,
  getTwoSteps,
  postLogin,
  postStep2,
} from './routes/privates/login';
import { root } from './routes/root';

export class Api {
  server: http.Server;
  private _app: express.Express;
  private _csrfProtection: express.RequestHandler;

  constructor() {
    this._csrfProtection = csurf({
      cookie: { maxAge: 120, sameSite: 'strict' },
    });
    this._app = express();
    this.server = http.createServer(this._app);
  }

  start(port: number): void {
    this._setup();
    this._routes();
    if (process.env.NODE_ENV !== 'production') {
      this._privateRoutes();
    } else {
      this._app.get('/', root);
    }

    // 404
    this._app.use('*', (req, res) => {
      res.status(404).json({
        status: 404,
        error: 'Endpoint not found',
        code: 'not_found',
      });
    });

    // error handler
    this._app.use((err: any, req: express.Request, res: express.Response) => {
      if (err?.code !== 'EBADCSRFTOKEN') {
        // return next();
        return res.status(500).json({
          status: 500,
          error: 'Internal Server Error',
          code: 'internal_server_error',
        });
      }

      // CSRF token errors
      res.status(403).json({
        status: 403,
        error: 'The form has expired',
        code: 'form_expired',
      });
    });

    this.server.listen(port, () => {
      log.info(`Ready http://localhost:${port}`);
    });
  }

  stop(cb: () => any): void {
    this.server.close(cb);
  }

  private _setup(): void {
    const jsonParser = json({ limit: '1mb' });
    this._app.disable('x-powered-by');

    this._app.use(urlencoded({ limit: '1mb', extended: true }));
    this._app.use((req, res, next) => {
      return jsonParser(req, res, (err) => {
        if (!err) {
          return next();
        }

        return res.status(400).json({
          status: 400,
          error: `Invalid json: ${err.message}`,
          code: 'invalid_json',
        });
      });
    });

    this._app.use(requestLogger);
    this._app.use(cookieParser());
    this._app.set('views', path.join(projectRoot, '/public/views'));
    this._app.set('view engine', 'ejs');
  }

  private _routes(): void {
    this._app
      .get('/ready', ready)
      .get('/healthy', healthy)
      .get('/list', list)
      .get('/render', routeRender.validate, routeRender.render)
      .post('/render', routeRender.validate, routeRender.renderJSON)
      .post('/login', routeLogin.validate, routeLogin.processLogin);
  }

  private _privateRoutes(): void {
    this._app.use(expressStatic(path.join(projectRoot, '/public')));

    this._app.get('/301', (req, res) =>
      res.redirect(301, '/test-website/basic.html')
    );

    // Login form with CSRF protection
    this._app
      .get('/secure/login', this._csrfProtection, getLogin)
      .post('/secure/login', this._csrfProtection, postLogin)
      .get('/secure/test', getTest)

      // 2-steps login form with CSRF protection
      .get('/secure/login/step1', this._csrfProtection, getStep1)
      .post('/secure/login/step2', this._csrfProtection, postStep2)
      .get('/secure/login/2steps', this._csrfProtection, getTwoSteps);
  }
}
