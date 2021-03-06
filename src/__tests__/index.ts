/* eslint-disable no-template-curly-in-string */
import { request } from 'undici';

function cleanString(body: string): string {
  return body.replace(/\n|\r/g, '').replace(/\s\s+/g, '');
}
jest.setTimeout(30 * 1000);

describe('main', () => {
  it('should render basic page', async () => {
    const { statusCode, headers, body } = await request(
      'http://localhost:3000/render?url=http%3A%2F%2Flocalhost%3A3000%2Ftest-website%2Fbasic.html'
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
      'http://localhost:3000/render?url=http%3A%2F%2Flocalhost%3A3000%2Ftest-website%2Fasync.html'
    );

    expect(statusCode).toEqual(200);
    expect(headers).toEqual({
      connection: 'keep-alive',
      'content-length': '741',
      'content-security-policy':
        "default-src 'none'; style-src * 'unsafe-inline'; img-src * data:; font-src *",
      'content-type': 'text/html; charset=utf-8',
      date: expect.any(String),
      etag: 'W/"2e5-ym9yBo+hQc1jA8y+CRp20AhJ0Qg"',
      'keep-alive': 'timeout=5',
    });

    let fullBody = '';
    for await (const chunk of body) {
      fullBody += chunk.toString();
    }
    expect(cleanString(fullBody)).toEqual(
      "<html><head><base href=\"http://localhost:3000\"></head><body><script>let i = 1;const addEvent = name => {document.body.innerHTML += `${i === 1 ? i : ` - ${i}`}. ${name}`;i++;}addEvent('Init')window.onload = addEvent.bind(null, 'window.onload');window.addEventListener('DOMContentLoaded', addEvent.bind(null, 'DOMContentLoaded'));setTimeout(addEvent.bind(null, 'setTimeout 1000'), 1000);setTimeout(addEvent.bind(null, 'setTimeout 5000'), 5000);setTimeout(addEvent.bind(null, 'setTimeout 10000'), 10000);setTimeout(addEvent.bind(null, 'setTimeout 20000'), 20000);</script>1. Init- 2. DOMContentLoaded - 3. window.onload</body></html>"
    );
  });

  it('should catch redirection', async () => {
    const { statusCode, headers, body } = await request(
      `http://localhost:3000/render?url=http%3A%2F%2Flocalhost%3A3000%2Ftest-website%2Fjs-redirect.html?to=${encodeURIComponent(
        '/test-website/basic.html'
      )}`
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
