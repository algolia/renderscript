import type { PostRenderSuccess } from 'api/responses';

import { request } from './helpers';

jest.setTimeout(10000);

describe('native', () => {
  it('should block basic unecessary requests', async () => {
    const { res, body } = await request('http://localhost:3000/render', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        url: 'http://localhost:3000/test-website/blocked-requests.html',
        ua: 'Algolia Crawler',
      }),
    });

    const json: PostRenderSuccess = JSON.parse(body);

    expect(res.statusCode).toBe(200);
    expect(json.metrics.page!.requests).toStrictEqual({
      total: 10,
      blocked: 5,
    });
  });
});

describe('adblocker', () => {
  it('should use adblock', async () => {
    const { res, body } = await request('http://localhost:3000/render', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        url: 'http://localhost:3000/test-website/blocked-requests.html',
        ua: 'Algolia Crawler',
        adblock: true,
      }),
    });

    const json: PostRenderSuccess = JSON.parse(body);

    expect(res.statusCode).toBe(200);
    expect(json.metrics.page!.requests).toStrictEqual({
      total: 10,
      blocked: 8,
    });
  });
});
