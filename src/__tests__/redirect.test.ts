import type { PostRenderSuccess } from 'api/@types/postRender';

import { cleanString, request } from './helpers';

describe('server redirect', () => {
  it('should return the redirection', async () => {
    // !---
    // Server Redirect are flaky since Playwright do not catch 301
    // You might want to relaunch the test if it failed.
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

    expect(json.body).toBeNull();
    expect(json.headers).toMatchObject({
      location: '/test-website/basic.html',
    });
    expect(json.statusCode).toBe(301);
    expect(json.timeout).toBe(false);
    expect(json.resolvedUrl).toBe(
      'http://localhost:3000/test-website/basic.html'
    );

    // Make sure execution was interrupted gracefully
    expect(json.metrics.timings.total).toBeGreaterThan(0);
    expect(json.metrics.timings.serialize).toBeNull();
    expect(json.metrics.timings.close).toBeGreaterThan(0);
  });
});

describe('meta refresh', () => {
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

    expect(json.statusCode).toBe(200);
    expect(json.body).toBeNull();
    expect(json.resolvedUrl).toBe(
      'http://localhost:3000/test-website/basic.html'
    );
    expect(json.error).toBe('redirection');

    // Make sure execution was interrupted gracefully
    expect(json.metrics.timings.total).toBeGreaterThan(0);
    expect(json.metrics.timings.serialize).toBeNull();
    expect(json.metrics.timings.close).toBeGreaterThan(0);
  });

  it('should return the redirection even if not executed yet', async () => {
    const { res, body } = await request('http://localhost:3000/render', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        // The client redirection happens after 5sec but we only wait 2sec
        url: 'http://localhost:3000/test-website/meta-refresh-5.html',
        ua: 'Algolia Crawler',
        waitTime: {
          max: 2000,
        },
      }),
    });

    const json: PostRenderSuccess = JSON.parse(body);
    expect(res.statusCode).toBe(200);

    expect(json.statusCode).toBe(200);
    expect(json.body).toBeNull();
    expect(json.resolvedUrl).toBe(
      'http://localhost:3000/test-website/basic.html'
    );
    expect(json.error).toBe('redirection');

    // Make sure execution was interrupted gracefully
    expect(json.metrics.timings.total).toBeGreaterThan(0);
    expect(json.metrics.timings.serialize).toBeNull();
    expect(json.metrics.timings.close).toBeGreaterThan(0);
  });
});

describe('js redirects', () => {
  it('should catch redirection', async () => {
    const { res, body } = await request('http://localhost:3000/render', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        url: 'http://localhost:3000/test-website/js-redirect.html?to=/test-website/basic.html',
        ua: 'Algolia Crawler',
        waitTime: {
          max: 2000,
        },
      }),
    });

    const json: PostRenderSuccess = JSON.parse(body);
    expect(res.statusCode).toBe(200);

    expect(json.statusCode).toBe(200);
    expect(json.body).toBeNull();
    expect(json.resolvedUrl).toBe(
      'http://localhost:3000/test-website/basic.html'
    );
    expect(json.error).toBe('redirection');

    // Make sure execution was interrupted gracefully
    expect(json.metrics.timings.total).toBeGreaterThan(0);
    expect(json.metrics.timings.serialize).toBeNull();
    expect(json.metrics.timings.close).toBeGreaterThanOrEqual(0);
  });

  it('should output 307', async () => {
    const { res, body } = await request(
      `http://localhost:3000/render?url=http%3A%2F%2Flocalhost%3A3000%2Ftest-website%2Fjs-redirect.html?to=${encodeURIComponent(
        '/test-website/basic.html'
      )}&ua=Algolia+Crawler`
    );

    expect(res.statusCode).toBe(307);
    expect(res.headers).toEqual({
      connection: 'keep-alive',
      'content-length': '0',
      date: expect.any(String),
      'keep-alive': 'timeout=5',
      location: 'http://localhost:3000/test-website/basic.html',
    });

    expect(cleanString(body)).toBe('');
  });
});
