import { request } from './helpers';

/**
 * Test the schema only on this file.
 */
describe('POST /render', () => {
  it('should validate 200', async () => {
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
    expect(res.statusCode).toBe(200);

    const json = JSON.parse(body);
    expect(json).toStrictEqual({
      body: expect.any(String),
      headers: {
        'accept-ranges': 'bytes',
        'cache-control': 'public, max-age=0',
        connection: 'keep-alive',
        'content-length': expect.any(String),
        'content-type': 'text/html; charset=UTF-8',
        date: expect.any(String),
        etag: 'W/"2fb-17e9234f5f2"',
        'keep-alive': 'timeout=5',
        'last-modified': expect.any(String),
      },
      statusCode: 200,
      metrics: {
        context: expect.any(Number),
        equiv: expect.any(Number),
        goto: expect.any(Number),
        minWait: 0,
        ready: expect.any(Number),
        serialize: expect.any(Number),
        total: expect.any(Number),
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
});
