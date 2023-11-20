import type { Request, Response } from 'express';

import { DELETE_COOKIE, SESSION_COOKIE } from '../../constants';
import { log } from '../../helpers/logger';

export function getLogin(req: Request, res: Response): void {
  res.render('login', {
    baseUrl: req.baseUrl,
    csrfToken: req.csrfToken(),
  });
}

export function postLogin(req: Request<any, any, any>, res: Response): void {
  const { username, password, redirect } = req.body;
  renderLogin({
    username,
    password,
    redirect,
    res,
  });
}

export function getTest(req: Request, res: Response): void {
  const cookie = req.get('Cookie') || '';
  const cookies = cookie.split(';').map((c) => c.trim());
  const granted = cookies.includes(SESSION_COOKIE);
  log.debug(`[/secure/test] granted: ${granted}, received cookie: ${cookie}`);
  res
    .contentType('text/html')
    .status(granted ? 200 : 401)
    .send(
      `<!DOCTYPE html><html lang="en"><body>${
        granted ? 'OK' : 'NOK'
      }(/test)</body></html>`
    );
}

export function getStep1(req: Request, res: Response): void {
  res.render('login-step1', {
    baseUrl: req.baseUrl,
    csrfToken: req.csrfToken(),
  });
}

export function postStep2(req: Request, res: Response): void {
  const { username } = req.body;
  res.render('login-step2', {
    baseUrl: req.baseUrl,
    csrfToken: req.csrfToken(),
    username,
  });
}

export function getTwoSteps(req: Request, res: Response): void {
  const { username } = req.body;
  res.render('login-2steps-js', {
    baseUrl: req.baseUrl,
    csrfToken: req.csrfToken(),
    username,
  });
}

function renderLogin({
  username,
  password,
  redirect,
  res,
}: {
  username: string;
  password: string;
  redirect?: boolean;
  res: Response;
}): void {
  const granted = username === 'admin' && password === 'password';
  const setCookie = `${
    granted ? SESSION_COOKIE : DELETE_COOKIE
  }; SameSite=Strict`;
  log.debug('renderLogin', {
    username,
    password,
    setCookie,
  });

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
}, 200);
</script>`
          : ''
      }<body>${granted ? 'OK' : 'NOK'}(/login)</body></html>`
    );
}
