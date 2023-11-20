import type { PostRenderSuccess } from '../api/@types/postRender';

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
      pending: 0,
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
      pending: 0,
      blocked: 9,
    });
    /**
     * @example
     * https://www.google-analytics.com/analytics.js
     * https://static.ads-twitter.com/uwt.js
     * https://www.googletagmanager.com/gtm.js?id=GTM-FOOBAR&l=dataLayer
     * https://via.placeholder.com/150
     * https://via.placeholder.com/152
     * http://localhost:3000/301
     * https://res.cloudinary.com/hilnmyskv/image/upload/v1623928136/ui-library/nav/search.svg
     * https://fonts.gstatic.com/s/qahiri/v1/tsssAp1RZy0C_hGeVHqgjHq-pg.woff2
     * https://fonts.gstatic.com/s/roboto/v30/KFOiCnqEu92Fr1Mu51QrIzc.ttf
     */
  });
});
