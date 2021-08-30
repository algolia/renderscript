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

import { DELETE_COOKIE, SESSION_COOKIE } from './constants';
import { list } from './routes/list';

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
    }

    this.server.listen(port, () => {
      console.info(`Server started http://localhost:${port}`);
    });
  }

  stop(cb: () => any): void {
    this.server.close(cb);
  }

  private _setup(): void {
    this._app.disable('x-powered-by');

    this._app.use(urlencoded({ limit: '1mb', extended: true }));
    this._app.use(json({ limit: '1mb' }));

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

    // error handler
    this._app.use(
      (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        if (err.code !== 'EBADCSRFTOKEN') {
          return next(err);
        }

        // CSRF token errors
        res.status(403).send('The form has expired');
      }
    );
  }

  private _privateRoutes(): void {
    this._app.use(expressStatic(path.join(projectRoot, '/public')));

    // Login form with CSRF protection
    this._app.get('/secure/login', this._csrfProtection, (req, res) => {
      res.render('login', {
        baseUrl: req.baseUrl,
        csrfToken: req.csrfToken(),
      });
    });

    this._app.post('/secure/login', this._csrfProtection, (req, res) => {
      const { username, password, redirect } = req.body;
      this._renderLoginResult({
        username,
        password,
        redirect,
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

    // 2-steps login form with CSRF protection
    this._app.get('/secure/login/step1', this._csrfProtection, (req, res) => {
      res.render('login-step1', {
        baseUrl: req.baseUrl,
        csrfToken: req.csrfToken(),
      });
    });

    this._app.post('/secure/login/step2', this._csrfProtection, (req, res) => {
      const { username } = req.body;
      res.render('login-step2', {
        baseUrl: req.baseUrl,
        csrfToken: req.csrfToken(),
        username,
      });
    });

    this._app.get('/secure/login/2steps', this._csrfProtection, (req, res) => {
      const { username } = req.body;
      res.render('login-2steps-js', {
        baseUrl: req.baseUrl,
        csrfToken: req.csrfToken(),
        username,
      });
    });
  }

  private _renderLoginResult({
    username,
    password,
    redirect,
    res,
  }: {
    username: string;
    password: string;
    redirect?: boolean;
    res: express.Response;
  }): void {
    const granted = username === 'admin' && password === 'password';
    const setCookie = `${
      granted ? SESSION_COOKIE : DELETE_COOKIE
    }; SameSite=Strict`;
    console.log(
      `[renderLoginResult] username: ${username}, password: ${password} => set-cookie: ${setCookie}`
    );
    res
      .contentType('text/html')
      .set('Set-Cookie', setCookie)
      .status(granted ? 200 : 401)
      .send(
        `<!DOCTYPE html><html lang="en">${
          redirect
            ? `<script>
// Redirect after 500ms to reproduce https://github.com/algolia/renderscript/pull/394
setTimeout(() => {
  window.location = new URL('/secure/test', window.location);
}, 500);
</script>`
            : ''
        }<body>${granted ? 'OK' : 'NOK'}</body></html>`
      );
  }
}
