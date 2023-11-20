import type { IncomingHttpHeaders } from 'http';

import type { Cookie } from 'playwright';
import { request as req } from 'undici';
import type Dispatcher from 'undici/types/dispatcher';

import type {
  PostLoginParams,
  PostLoginSuccess,
} from '../api/@types/postLogin';
import type { PostRenderParams } from '../api/@types/postRender';

export async function request(
  url: string,
  params?: Parameters<typeof req>[1]
): Promise<{ res: Dispatcher.ResponseData; body: string }> {
  const res = await req(url, params);

  let body = '';
  for await (const chunk of res.body) {
    body += chunk.toString();
  }

  return { res, body };
}

export async function postRender(
  opts: Partial<PostRenderParams>,
  headers?: IncomingHttpHeaders
): Promise<{ res: Dispatcher.ResponseData; body: string }> {
  return await request('http://localhost:3000/render', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({
      ua: 'Algolia Crawler',
      ...opts,
    }),
  });
}

export async function sendLoginRequest(
  opts: Partial<PostLoginParams>
): Promise<{ res: Dispatcher.ResponseData; body: string }> {
  return await request('http://localhost:3000/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      ua: 'Algolia Crawler',
      ...opts,
    }),
  });
}

export function cleanString(body: string): string {
  return body.replace(/\n|\r/g, '').replace(/\s\s+/g, '');
}

export function cleanCookies(
  cookies: PostLoginSuccess['cookies']
): Array<
  Omit<Cookie, 'expires' | 'httpOnly' | 'sameSite' | 'secure' | 'value'>
> {
  return cookies.map(
    ({ value, expires, httpOnly, secure, sameSite, ...rest }) => {
      return rest;
    }
  );
}

export function cookiesToString(cookies: PostLoginSuccess['cookies']): string {
  if (!cookies) {
    return '';
  }
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
}
