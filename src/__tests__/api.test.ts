import type { PostRenderSuccess } from 'api/@types/postRender';

import { postRender, request } from './helpers';

/**
 * Test the schema only on this file.
 */
describe('POST /render', () => {
  it('should validate 200', async () => {
    const { res, body } = await postRender({
      url: 'http://localhost:3000/test-website/async.html',
      ua: 'Algolia Crawler',
    });
    expect(res.statusCode).toBe(200);

    const json: PostRenderSuccess = JSON.parse(body);
    expect(json).toStrictEqual({
      body: expect.any(String),
      error: null,
      rawError: null,
      headers: {
        'accept-ranges': 'bytes',
        'cache-control': 'public, max-age=0',
        connection: 'keep-alive',
        'content-length': expect.any(String),
        'content-type': 'text/html; charset=UTF-8',
        date: expect.any(String),
        etag: expect.any(String),
        'keep-alive': 'timeout=5',
        'last-modified': expect.any(String),
      },
      statusCode: 200,
      resolvedUrl: null,
      timeout: false,
      metrics: {
        renderingBudget: {
          consumed: expect.any(Number),
          max: 20000,
        },
        timings: {
          context: expect.any(Number),
          equiv: expect.any(Number),
          goto: expect.any(Number),
          minWait: null,
          ready: expect.any(Number),
          serialize: expect.any(Number),
          close: expect.any(Number),
          total: expect.any(Number),
        },
        page: {
          contentLength: {
            main: 763,
            total: 763,
          },
          mem: {
            jsHeapTotalSize: 0,
            jsHeapUsedSize: 0,
          },
          requests: {
            blocked: 0,
            total: 1,
          },
          timings: {
            download: expect.any(Number),
          },
        },
      },
    });
  });

  it('should handle bad json', async () => {
    const res = await request('http://localhost:3000/render', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: '{"url": "https://example.com", "ua": "test}',
    });

    expect(JSON.parse(res.body)).toStrictEqual({
      status: 400,
      error: 'Invalid json: Unexpected end of JSON input',
      code: 'invalid_json',
    });
  });
});
