import { cleanString, request } from './helpers';

jest.setTimeout(30 * 1000);

describe('main', () => {
  it('should error when no url', async () => {
    const { res, body } = await request('http://localhost:3000/render?');

    expect(res.statusCode).toBe(400);

    expect(JSON.parse(body)).toEqual({
      details: [
        { label: 'url', message: 'url is required', type: 'required' },
        { label: 'ua', message: 'ua is required', type: 'required' },
      ],
      error: true,
      message: 'Bad Request',
    });
  });

  it('should error when no user agent', async () => {
    const { res, body } = await request(
      'http://localhost:3000/render?url=http%3A%2F%2Flocalhost%3A3000%2Ftest-website%2Fbasic.html'
    );

    expect(res.statusCode).toBe(400);

    expect(JSON.parse(body)).toEqual({
      error: true,
      message: 'Bad Request',
      details: [{ label: 'ua', type: 'required', message: 'ua is required' }],
    });
  });

  it('should validate waitTime', async () => {
    const { res, body } = await request(
      'http://localhost:3000/render?url=http%3A%2F%2Flocalhost%3A3000%2Ftest-website%2Fbasic.html&ua=Algolia+Crawler&waitTime[min]=foo&waitTime[max]=bar'
    );

    expect(res.statusCode).toBe(400);

    expect(JSON.parse(body)).toEqual({
      error: true,
      message: 'Bad Request',
      details: [
        {
          errors: [
            {
              label: 'min',
              message: 'min must be a valid number',
              type: 'number.typeof',
            },
            {
              label: 'max',
              message: 'max must be a valid number',
              type: 'number.typeof',
            },
          ],
          label: 'waitTime',
          message: 'waitTime does not match its schema',
          type: 'object.schema',
        },
      ],
    });
  });

  it('should render basic page', async () => {
    const { res, body } = await request(
      'http://localhost:3000/render?url=http%3A%2F%2Flocalhost%3A3000%2Ftest-website%2Fbasic.html&ua=Algolia+Crawler'
    );

    expect(res.statusCode).toBe(200);
    expect(res.headers).toEqual({
      connection: 'keep-alive',
      'content-length': '99',
      'content-security-policy':
        "default-src 'none'; style-src * 'unsafe-inline'; img-src * data:; font-src *",
      'content-type': 'text/html; charset=utf-8',
      date: expect.any(String),
      etag: 'W/"63-ATTA7nqzk1rd80EwnOV2527LOMU"',
      'keep-alive': 'timeout=5',
    });

    expect(cleanString(body)).toBe(
      `<html><head><base href="http://localhost:3000"></head><body>A basic page</body></html>`
    );
  });

  it('should catch redirection', async () => {
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

  it('should expose metrics', async () => {
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

    const json = JSON.parse(body);

    expect(res.statusCode).toBe(200);

    expect(json.metrics).toMatchObject({
      goto: expect.any(Number),
      minWait: expect.any(Number),
      serialize: expect.any(Number),
      total: expect.any(Number),
      page: {
        layoutDuration: expect.any(Number),
        scriptDuration: expect.any(Number),
        taskDuration: expect.any(Number),
        jsHeapUsedSize: expect.any(Number),
        jsHeapTotalSize: expect.any(Number),
        requests: expect.any(Number),
        blockedRequests: expect.any(Number),
        contentLength: 763,
        contentLengthTotal: 763,
      },
    });
    expect(json.metrics.goto).toBeLessThanOrEqual(1100);
    expect(json.metrics.minWait).toBeLessThanOrEqual(1100);
    expect(json.metrics.serialize).toBeLessThanOrEqual(20);
    expect(json.metrics.total).toBeLessThanOrEqual(2100);
    expect(json.metrics.page.layoutDuration).toBeLessThanOrEqual(10);
    expect(json.metrics.page.scriptDuration).toBeLessThanOrEqual(10);
    expect(json.metrics.page.taskDuration).toBeLessThanOrEqual(50);
    expect(json.metrics.page.jsHeapUsedSize).toBeLessThanOrEqual(1637360);
    expect(json.metrics.page.jsHeapTotalSize).toBeLessThanOrEqual(2639520);
    expect(json.metrics.page.requests).toBe(1);
    expect(json.metrics.page.blockedRequests).toBe(0);
  });
});
