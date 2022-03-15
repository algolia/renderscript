import type { PostRenderSuccess } from 'api/@types/postRender';

import { postRender } from './helpers';

jest.setTimeout(10000);

describe('native', () => {
  it('should block basic unecessary requests', async () => {
    const { res, body } = await postRender({
      url: 'http://localhost:3000/test-website/blocked-requests.html',
      ua: 'Algolia Crawler',
    });

    const json: PostRenderSuccess = JSON.parse(body);

    expect(res.statusCode).toBe(200);
    expect(json.metrics.page!.requests).toStrictEqual({
      total: 11,
      blocked: 6,
    });
  });
});

describe('adblocker', () => {
  it('should use adblock', async () => {
    const { res, body } = await postRender({
      url: 'http://localhost:3000/test-website/blocked-requests.html',
      ua: 'Algolia Crawler',
      adblock: true,
    });

    const json: PostRenderSuccess = JSON.parse(body);

    expect(res.statusCode).toBe(200);
    expect(json.metrics.page!.requests).toStrictEqual({
      total: 11,
      blocked: 9,
    });
  });
});
