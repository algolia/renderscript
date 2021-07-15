/* eslint-disable no-template-curly-in-string */
import type { Protocol } from 'puppeteer-core/lib/esm/puppeteer/api-docs-entry';
import { request } from 'undici';
import type { ResponseData } from 'undici/types/dispatcher';

function cleanString(body: string): string {
  return body.replace(/\n|\r/g, '').replace(/\s\s+/g, '');
}
jest.setTimeout(30 * 1000);

describe('main', () => {
  it('should error when no url', async () => {
    const { statusCode, body } = await request('http://localhost:3000/render?');

    expect(statusCode).toEqual(400);

    let fullBody = '';
    for await (const chunk of body) {
      fullBody += chunk.toString();
    }
    expect(cleanString(fullBody)).toEqual(
      '{"error":true,"message":"Missing URL in query params"}'
    );
  });

  it('should error when no user agent', async () => {
    const { statusCode, body } = await request(
      'http://localhost:3000/render?url=http%3A%2F%2Flocalhost%3A3000%2Ftest-website%2Fbasic.html'
    );

    expect(statusCode).toEqual(400);

    let fullBody = '';
    for await (const chunk of body) {
      fullBody += chunk.toString();
    }
    expect(cleanString(fullBody)).toEqual(
      '{"error":true,"message":"Missing User-Agent"}'
    );
  });

  it('should render basic page', async () => {
    const { statusCode, headers, body } = await request(
      'http://localhost:3000/render?url=http%3A%2F%2Flocalhost%3A3000%2Ftest-website%2Fbasic.html&ua=Algolia+Crawler'
    );

    expect(statusCode).toEqual(200);
    expect(headers).toEqual({
      connection: 'keep-alive',
      'content-length': '99',
      'content-security-policy':
        "default-src 'none'; style-src * 'unsafe-inline'; img-src * data:; font-src *",
      'content-type': 'text/html; charset=utf-8',
      date: expect.any(String),
      etag: 'W/"63-ATTA7nqzk1rd80EwnOV2527LOMU"',
      'keep-alive': 'timeout=5',
    });

    let fullBody = '';
    for await (const chunk of body) {
      fullBody += chunk.toString();
    }
    expect(cleanString(fullBody)).toEqual(
      `<html><head><base href="http://localhost:3000"></head><body>A basic page</body></html>`
    );
  });

  it('should render async page', async () => {
    const { statusCode, headers, body } = await request(
      'http://localhost:3000/render?url=http%3A%2F%2Flocalhost%3A3000%2Ftest-website%2Fasync.html&ua=Algolia+Crawler'
    );

    expect(statusCode).toEqual(200);
    expect(headers).toEqual({
      connection: 'keep-alive',
      'content-length': '843',
      'content-security-policy':
        "default-src 'none'; style-src * 'unsafe-inline'; img-src * data:; font-src *",
      'content-type': 'text/html; charset=utf-8',
      date: expect.any(String),
      etag: 'W/"34b-XSEOmhq6gvsRnSyzs9lfm2g+AC8"',
      'keep-alive': 'timeout=5',
    });

    let fullBody = '';
    for await (const chunk of body) {
      fullBody += chunk.toString();
    }
    expect(cleanString(fullBody)).toEqual(
      "<html><head><base href=\"http://localhost:3000\"></head><body><div id=\"ua\">Algolia Crawler</div><script>document.getElementById('ua').innerText = window.navigator.userAgent;</script><script>let i = 1;const addEvent = name => {document.body.innerHTML += `${i === 1 ? i : ` - ${i}`}. ${name}`;i++;}addEvent('Init')window.onload = addEvent.bind(null, 'window.onload');window.addEventListener('DOMContentLoaded', addEvent.bind(null, 'DOMContentLoaded'));setTimeout(addEvent.bind(null, 'setTimeout 1000'), 1000);setTimeout(addEvent.bind(null, 'setTimeout 5000'), 5000);setTimeout(addEvent.bind(null, 'setTimeout 10000'), 10000);setTimeout(addEvent.bind(null, 'setTimeout 20000'), 20000);</script>1. Init - 2. DOMContentLoaded - 3. window.onload</body></html>"
    );
  });

  it('should catch redirection', async () => {
    const { statusCode, headers, body } = await request(
      `http://localhost:3000/render?url=http%3A%2F%2Flocalhost%3A3000%2Ftest-website%2Fjs-redirect.html?to=${encodeURIComponent(
        '/test-website/basic.html'
      )}&ua=Algolia+Crawler`
    );

    expect(statusCode).toEqual(307);
    expect(headers).toEqual({
      connection: 'keep-alive',
      'content-length': '0',
      date: expect.any(String),
      'keep-alive': 'timeout=5',
      location: 'http://localhost:3000/test-website/basic.html',
    });

    let fullBody = '';
    for await (const chunk of body) {
      fullBody += chunk.toString();
    }
    expect(cleanString(fullBody)).toEqual('');
  });
});

describe('login', () => {
  it('should error when no username', async () => {
    const { statusCode, body } = await sendLoginRequest({
      url: 'http://localhost:3000/secure/login',
      username: '',
      password: 'password',
    });

    expect(statusCode).toEqual(400);

    let fullBody = '';
    for await (const chunk of body) {
      fullBody += chunk.toString();
    }
    expect(cleanString(fullBody)).toEqual(
      '{"error":true,"message":"Missing username"}'
    );
  });

  it('should error when no username', async () => {
    const { statusCode, body } = await sendLoginRequest({
      url: 'http://localhost:3000/secure/login',
      username: 'admin',
      password: '',
    });

    expect(statusCode).toEqual(400);

    let fullBody = '';
    for await (const chunk of body) {
      fullBody += chunk.toString();
    }
    expect(cleanString(fullBody)).toEqual(
      '{"error":true,"message":"Missing password"}'
    );
  });

  it('should works with correct credentials', async () => {
    const { statusCode, body } = await sendLoginRequest({
      url: 'http://localhost:3000/secure/login',
      username: 'admin',
      password: 'password',
    });

    expect(statusCode).toEqual(200);

    let fullBody = '';
    for await (const chunk of body) {
      fullBody += chunk.toString();
    }
    const cookies = JSON.parse(fullBody).cookies;
    expect(
      cookies.find(
        (cookie: Protocol.Network.Cookie) => cookie.name === 'sessionToken'
      )
    ).toMatchSnapshot();
    // Check that we actually went through the form
    expect(
      cookies.find((cookie: Protocol.Network.Cookie) => cookie.name === '_csrf')
    ).not.toBeUndefined();
  });

  it('should works even with a 2-steps login', async () => {
    const { statusCode, body } = await sendLoginRequest({
      url: 'http://localhost:3000/secure/login/step1',
      username: 'admin',
      password: 'password',
    });

    expect(statusCode).toEqual(200);

    let fullBody = '';
    for await (const chunk of body) {
      fullBody += chunk.toString();
    }
    const cookies = JSON.parse(fullBody).cookies;
    expect(
      cookies.find(
        (cookie: Protocol.Network.Cookie) => cookie.name === 'sessionToken'
      )
    ).toMatchSnapshot();
    // Check that we actually went through the form
    expect(
      cookies.find((cookie: Protocol.Network.Cookie) => cookie.name === '_csrf')
    ).not.toBeUndefined();
  });

  it('should works with a 2-steps JS login', async () => {
    const { statusCode, body } = await sendLoginRequest({
      url: 'http://localhost:3000/secure/login/2steps',
      username: 'admin',
      password: 'password',
    });

    expect(statusCode).toEqual(200);

    let fullBody = '';
    for await (const chunk of body) {
      fullBody += chunk.toString();
    }
    const cookies = JSON.parse(fullBody).cookies;
    expect(
      cookies.find(
        (cookie: Protocol.Network.Cookie) => cookie.name === 'sessionToken'
      )
    ).toMatchSnapshot();
    // Check that we actually went through the form
    expect(
      cookies.find((cookie: Protocol.Network.Cookie) => cookie.name === '_csrf')
    ).not.toBeUndefined();
  });

  it('should works but not get a session token with bad credentials', async () => {
    const { statusCode, body } = await sendLoginRequest({
      url: 'http://localhost:3000/secure/login',
      username: 'admin',
      password: 'admin',
    });

    expect(statusCode).toEqual(200);

    let fullBody = '';
    for await (const chunk of body) {
      fullBody += chunk.toString();
    }
    const cookies = JSON.parse(fullBody).cookies;
    expect(
      cookies.find(
        (cookie: Protocol.Network.Cookie) => cookie.name === 'sessionToken'
      )
    ).toBeUndefined();
    // Check that we actually went through the form
    expect(
      cookies.find((cookie: Protocol.Network.Cookie) => cookie.name === '_csrf')
    ).not.toBeUndefined();
  });
});

async function sendLoginRequest({
  url,
  username,
  password,
}: {
  url: string;
  username: string;
  password: string;
}): Promise<ResponseData> {
  return await request('http://localhost:3000/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `url=${url}&username=${username}&password=${password}&ua=Algolia Crawler`,
  });
}
