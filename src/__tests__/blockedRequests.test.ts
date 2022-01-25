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

    const json = JSON.parse(body);

    expect(res.statusCode).toBe(200);
    expect(json.metrics.page.requests).toBe(11);
    expect(json.metrics.page.blockedRequests).toBe(6);
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

    const json = JSON.parse(body);

    expect(res.statusCode).toBe(200);
    expect(json.metrics.page.requests).toBe(11);
    expect(json.metrics.page.blockedRequests).toBe(9);
  });
});
