import { request as req } from 'undici';
import type { ResponseData } from 'undici/types/dispatcher';

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
}: {
  url: string;
  username: string;
  password: string;
}): Promise<{ res: ResponseData; body: string }> {
  return await request('http://localhost:3000/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `url=${url}&username=${username}&password=${password}&ua=Algolia Crawler`,
  });
}

export function cleanString(body: string): string {
  return body.replace(/\n|\r/g, '').replace(/\s\s+/g, '');
}
