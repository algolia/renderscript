import type { GetHealthySuccess } from '../api/@types/getHealthy';

import { postRender, request } from './helpers';

describe('manager', () => {
  it('should properly close page after done', async () => {
    // Before
    const { res, body } = await request('http://localhost:3000/healthy');
    expect(res.statusCode).toBe(200);

    const before: GetHealthySuccess = JSON.parse(body);
    expect(before).toEqual({
      ready: true,
      tasksRunning: 0,
      pagesOpen: 0,
      totalRun: expect.any(Number),
    });

    // Process something
    const { res: resRender } = await postRender({
      url: 'http://localhost:3000/test-website/async.html',
      ua: 'Algolia Crawler',
    });
    expect(resRender.statusCode).toBe(200);

    // After
    const { res: resAfter, body: bodyAfter } = await request(
      'http://localhost:3000/healthy'
    );
    expect(resAfter.statusCode).toBe(200);

    const after: GetHealthySuccess = JSON.parse(bodyAfter);
    expect(after).toEqual({
      ready: true,
      tasksRunning: 0,
      pagesOpen: 0,
      totalRun: expect.any(Number),
    });

    // Compare because we can't know how much due to of other that could have been run before
    expect(after.totalRun).toBeGreaterThan(0);
    expect(before.totalRun).toBeLessThan(after.totalRun);
  });
});
