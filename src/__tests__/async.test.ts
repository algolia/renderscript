import type { PostRenderSuccess } from 'api/@types/postRender';

import { cleanString, request } from './helpers';

jest.setTimeout(10000);

describe('async', () => {
  it('should render async page', async () => {
    const { res, body } = await request(
      'http://localhost:3000/render?url=http%3A%2F%2Flocalhost%3A3000%2Ftest-website%2Fasync.html&ua=Algolia+Crawler'
    );

    expect(res.statusCode).toBe(200);
    expect(res.headers).toEqual({
      connection: 'keep-alive',
      'content-length': expect.any(String),
      'content-security-policy':
        "default-src 'none'; style-src * 'unsafe-inline'; img-src * data:; font-src *",
      'content-type': 'text/html; charset=utf-8',
      date: expect.any(String),
      etag: expect.any(String),
      'keep-alive': 'timeout=5',
    });

    expect(cleanString(body)).toMatchSnapshot();
  });

  it('should wait by default for 0ms', async () => {
    const { res, body } = await request('http://localhost:3000/render', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        url: 'http://localhost:3000/test-website/async.html',
        ua: 'Algolia Crawler',
      }),
    });

    const json: PostRenderSuccess = JSON.parse(body);
    expect(res.statusCode).toBe(200);
    expect(json.metrics.timings.total).toBeLessThanOrEqual(2000);
    expect(json.body).not.toMatch('4. setTimeout 1000');
  });

  it('should wait at least 6000ms', async () => {
    const { res, body } = await request('http://localhost:3000/render', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        url: 'http://localhost:3000/test-website/async.html',
        ua: 'Algolia Crawler',
        waitTime: {
          min: 6000,
        },
      }),
    });

    const json: PostRenderSuccess = JSON.parse(body);
    expect(res.statusCode).toBe(200);

    expect(json.metrics.timings.minWait).toBeGreaterThanOrEqual(5000);
    expect(json.metrics.timings.total).toBeGreaterThanOrEqual(6000);
    expect(json.metrics.timings.total).toBeLessThanOrEqual(7000);
    expect(json.body).toMatch('5. setTimeout 5000');
  });

  it('should wait at most 5000ms', async () => {
    const { res, body } = await request('http://localhost:3000/render', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        url: 'http://localhost:3000/test-website/slow.html',
        ua: 'Algolia Crawler',
        waitTime: {
          min: 4000,
          max: 5000,
        },
      }),
    });

    const json: PostRenderSuccess = JSON.parse(body);
    expect(res.statusCode).toBe(200);
    expect(json.metrics.timings.goto).toBeLessThanOrEqual(20);

    // In that case the page is slow so min is not used
    expect(json.metrics.timings.minWait).toBeNull();

    expect(json.metrics.timings.ready).toBeLessThanOrEqual(5020);
    expect(json.metrics.timings.total).toBeGreaterThanOrEqual(4000);
    expect(json.metrics.timings.total).toBeLessThanOrEqual(5120);

    // We count the dot because there is no way to have precise execution
    // There should be around 25 dots (one fetch every 200ms during 5s = 25 dots)
    // We check for 20 to have some margin
    // And no more than 30 to check that it was not executed more than 5s
    expect(json.body).toMatch('.'.repeat(20));
    expect(json.body).not.toMatch('.'.repeat(30));
  });
});

describe('redirects', () => {
  describe('server redirect', () => {
    it('should return the redirection', async () => {
      const { res, body } = await request('http://localhost:3000/render', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          url: 'http://localhost:3000/301',
          ua: 'Algolia Crawler',
        }),
      });

      const json: PostRenderSuccess = JSON.parse(body);
      expect(res.statusCode).toBe(200);

      expect(json.resolvedUrl).toBe(
        'http://localhost:3000/test-website/basic.html'
      );
    });
  });

  describe('client redirect', () => {
    it('should return the redirection', async () => {
      const { res, body } = await request('http://localhost:3000/render', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          url: 'http://localhost:3000/test-website/meta-refresh.html',
          ua: 'Algolia Crawler',
        }),
      });

      const json: PostRenderSuccess = JSON.parse(body);
      expect(res.statusCode).toBe(200);

      expect(json.resolvedUrl).toBe(
        'http://localhost:3000/test-website/basic.html'
      );
      expect(json.error).toBeNull(); // Make sure we blocked navigation
    });

    it('should return the redirection even if not executed yet', async () => {
      const { res, body } = await request('http://localhost:3000/render', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          // The client redirection happens after 5 seconds
          url: 'http://localhost:3000/test-website/meta-refresh-5.html',
          ua: 'Algolia Crawler',
          waitTime: {
            max: 2000,
          },
        }),
      });

      const json: PostRenderSuccess = JSON.parse(body);
      expect(res.statusCode).toBe(200);

      expect(json.resolvedUrl).toBe(
        'http://localhost:3000/test-website/basic.html'
      );
    });
  });
});
