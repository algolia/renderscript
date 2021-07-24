import { request } from './helpers';

jest.setTimeout(10000);

it('should render async page', async () => {
  const { res, body } = await request('http://localhost:3000/list');
  expect(res.statusCode).toBe(200);
  expect(JSON.parse(body)).toEqual({ open: ['about:blank'] });
});
