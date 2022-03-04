import { wait } from '../helpers/wait';

import { request } from './helpers';

jest.setTimeout(25000);

describe('list', () => {
  it('should list nothing', async () => {
    const { res, body } = await request('http://localhost:3000/list');
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(body)).toEqual({ open: [] });
  });

  it('should list current page', async () => {
    const r = request('http://localhost:3000/render', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        url: 'http://localhost:3000/test-website/slow.html',
        ua: 'Algolia Crawler',
        waitTime: {
          min: 2000,
          max: 3000,
        },
      }),
    });

    await wait(100);

    // Currently processing
    const res1 = await request('http://localhost:3000/list');
    expect(JSON.parse(res1.body)).toEqual({
      open: ['http://localhost:3000/test-website/slow.html'],
    });

    await r;

    // Cleared
    const res2 = await request('http://localhost:3000/list');
    expect(JSON.parse(res2.body)).toEqual({
      open: [],
    });
  });
});
