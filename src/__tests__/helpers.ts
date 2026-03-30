import type { Cookie } from 'playwright';

import type {
  PostLoginParams,
  PostLoginSuccess,
} from '../api/@types/postLogin';
import type { PostRenderParams } from '../api/@types/postRender';

interface TestResponse {
  statusCode: number;
  status: number;
  headers: Record<string, string>;
}

export async function request(
  url: string,
  params?: RequestInit
): Promise<{ res: TestResponse; body: string }> {
  const raw = await fetch(url, {
    redirect: 'manual',
    ...params,
  });
  const body = await raw.text();

  // Convert to a plain object matching the shape tests expect (undici style)
  const headers: Record<string, string> = {};
  raw.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const res: TestResponse = {
    statusCode: raw.status,
    status: raw.status,
    headers,
  };

  return { res, body };
}

export async function postRender(
  opts: Partial<PostRenderParams>,
  headers?: Record<string, string>
): Promise<{ res: TestResponse; body: string }> {
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
): Promise<{ res: TestResponse; body: string }> {
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
