import type { PostRenderSuccess } from '../api/@types/postRender';

import { cleanString, postRender, request } from './helpers';

describe('server redirect', () => {
  it('should return the redirection', async () => {
    // !---
    // Server Redirect are flaky since Playwright do not catch 301
    // You might want to relaunch the test if it failed.
    const { res, body } = await postRender({
      url: 'http://localhost:3000/301',
      waitTime: {
        min: 5000, // wait long to be sure we end up being redirected
      },
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
    const { res, body } = await postRender({
      url: 'http://localhost:3000/test-website/meta-refresh.html',
      ua: 'Algolia Crawler',
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
    const { res, body } = await postRender({
      // The client redirection happens after 5sec but we only wait 2sec
      url: 'http://localhost:3000/test-website/meta-refresh-5.html',
      ua: 'Algolia Crawler',
      waitTime: {
        max: 2000,
      },
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
    const { res, body } = await postRender({
      url: 'http://localhost:3000/test-website/js-redirect.html?to=/test-website/basic.html',
      ua: 'Algolia Crawler',
      waitTime: {
        max: 2000,
      },
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

  it('should catch path', async () => {
    const { res, body } = await postRender({
      url: 'http://localhost:3000/test-website/js-redirect-path.html',
      ua: 'Algolia Crawler',
      waitTime: {
        min: 2000,
      },
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

  it('should catch history pushState', async () => {
    const { res, body } = await postRender({
      url: 'http://localhost:3000/test-website/js-redirect-history.html',
      ua: 'Algolia Crawler',
      waitTime: {
        min: 2000,
      },
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

  it('should catch hash but render normally', async () => {
    const { res, body } = await postRender({
      url: 'http://localhost:3000/test-website/js-redirect-hash.html',
      ua: 'Algolia Crawler',
      waitTime: {
        min: 2000,
      },
    });

    const json: PostRenderSuccess = JSON.parse(body);
    expect(res.statusCode).toBe(200);

    expect(json.statusCode).toBe(200);
    expect(json.body).toBe(
      `<!DOCTYPE html><html><head> </head>\n\n<body>\n  <script>window.location.hash = "#redirection";</script>\n\n\n\n</body></html>`
    );
    expect(json.error).toBeNull();

    // Make sure execution was interrupted gracefully
    expect(json.metrics.timings.total).toBeGreaterThan(0);
    expect(json.metrics.timings.serialize).toBeGreaterThan(0);
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
