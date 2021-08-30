import { cleanString, request } from './helpers';

jest.setTimeout(10000);

it('should render async page', async () => {
  const { res, body } = await request(
    'http://localhost:3000/render?url=http%3A%2F%2Flocalhost%3A3000%2Ftest-website%2Fasync.html&ua=Algolia+Crawler'
  );

  expect(res.statusCode).toEqual(200);
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

  const json = JSON.parse(body);
  expect(res.statusCode).toEqual(200);
  expect(json.metrics.total).toBeLessThanOrEqual(2000);
  expect(json.body).toMatch('setTimeout 1000');
});

it('should wait 5000ms', async () => {
  const { res, body } = await request('http://localhost:3000/render', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      url: 'http://localhost:3000/test-website/async.html',
      ua: 'Algolia Crawler',
      waitTime: {
        min: 5000,
      },
    }),
  });

  const json = JSON.parse(body);
  expect(res.statusCode).toEqual(200);
  expect(json.metrics.total).toBeGreaterThanOrEqual(5000);
  expect(json.metrics.total).toBeLessThanOrEqual(6000);
  expect(json.body).toMatch('setTimeout 5000');
});
