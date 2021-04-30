import * as http from 'http';
import * as path from 'path';

import { urlencoded } from 'body-parser';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import express, { static as expressStatic } from 'express';

import requestLogger from 'api/helpers/requestLogger';
import healthy from 'api/routes/healthy';
import ready from 'api/routes/ready';
import * as render from 'api/routes/render';
import projectRoot from 'helpers/projectRoot';

const SESSION_COOKIE = 'sessionToken=53cu23_535510n';
const DELETE_COOKIE = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT';

export default class Api {
  server: http.Server;
  private _app: express.Express;
  private _csrfProtection: express.RequestHandler;

  constructor() {
    this._csrfProtection = csurf({ cookie: { maxAge: 120 } });
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
    this._app.use(cookieParser());
    this._app.set('views', path.join(projectRoot, '/public/views'));
    this._app.set('view engine', 'ejs');
  }

  private _routes(): void {
    this._app
      .get('/ready', ready)
      .get('/healthy', healthy)
      .get('/render', render.getURLFromQuery, render.validateURL, render.render)
      .post(
        '/render',
        render.getParamsFromBody,
        render.validateURL,
        render.renderJSON
      )
      .post(
        '/login',
        render.getParamsFromBody,
        render.validateURL,
        render.processLogin
      );

    this._app.use(expressStatic(path.join(projectRoot, '/public')));

    // Login form with CSRF protection
    this._app.get('/secure/login', this._csrfProtection, (req, res) => {
      res.render('login', {
        baseUrl: req.baseUrl,
        csrfToken: req.csrfToken(),
      });
    });

    this._app.post('/secure/login', this._csrfProtection, (req, res) => {
      const { id, password } = req.body;
      this._renderLoginResult({
        id,
        password,
        res,
      });
    });

    this._app.get('/secure/test', (req, res) => {
      const cookie = req.get('Cookie') || '';
      const cookies = cookie.split(';').map((c) => c.trim());
      const granted = cookies.includes(SESSION_COOKIE);
      console.log(
        `[/secure/test] granted: ${granted}, received cookie: ${cookie}`
      );
      res
        .contentType('text/html')
        .status(granted ? 200 : 401)
        .send(
          `<!DOCTYPE html><html lang="en"><body>${
            granted ? 'OK' : 'NOK'
          }</body></html>`
        );
    });

    // error handler
    this._app.use(
      (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        if (err.code !== 'EBADCSRFTOKEN') return next(err);

        // CSRF token errors
        res.status(403).send('The form has expired');
      }
    );
  }

  private _renderLoginResult({
    id,
    password,
    res,
  }: {
    id: string;
    password: string;
    res: express.Response;
  }): void {
    const granted = id === 'admin' && password === 'password';
    const setCookie = granted ? SESSION_COOKIE : DELETE_COOKIE;
    console.log(
      `[renderLoginResult] id: ${id}, password: ${password} => set-cookie: ${setCookie}`
    );
    res
      .contentType('text/html')
      .set('Set-Cookie', setCookie)
      .status(granted ? 200 : 401)
      .send(
        `<!DOCTYPE html><html lang="en"><body>${
          granted ? 'OK' : 'NOK'
        }</body></html>`
      );
  }
}
