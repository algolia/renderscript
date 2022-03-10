import type { Cookie } from 'playwright-chromium';
import { request as req } from 'undici';
import type { ResponseData } from 'undici/types/dispatcher';

import type { PostLoginParams, PostLoginSuccess } from 'api/@types/postLogin';

export async function request(
  url: string,
  params?: Parameters<typeof req>[1]
): Promise<{ res: ResponseData; body: string }> {
  const res = await req(url, params);

  let body = '';
  for await (const chunk of res.body) {
    body += chunk.toString();
  }

  return { res, body };
}

export async function sendLoginRequest({
  url,
  username,
  password,
  renderHTML,
  waitTime,
}: Partial<PostLoginParams>): Promise<{ res: ResponseData; body: string }> {
  return await request('http://localhost:3000/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      url,
      username,
      password,
      renderHTML,
      ua: 'Algolia Crawler',
      waitTime,
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
