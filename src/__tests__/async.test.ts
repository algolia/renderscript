import { cleanString, request } from './helpers';

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
