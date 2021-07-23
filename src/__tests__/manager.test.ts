import { request } from './helpers';

it('should properly close page after done', async () => {
  // Before
  const { res, body } = await request('http://localhost:3000/healthy');
  expect(res.statusCode).toBe(200);

  expect(JSON.parse(body)).toEqual({
    ready: true,
    tasksRunning: 0,
    pagesOpen: 1,
  });

  // Process something
  const { res: resRender } = await request('http://localhost:3000/render', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      url: 'http://localhost:3000/test-website/async.html',
      ua: 'Algolia Crawler',
    }),
  });
  expect(resRender.statusCode).toBe(200);

  // After
  const { res: resAfter, body: bodyAfter } = await request(
    'http://localhost:3000/healthy'
  );
  expect(resAfter.statusCode).toBe(200);

  expect(JSON.parse(bodyAfter)).toEqual({
    ready: true,
    tasksRunning: 0,
    pagesOpen: 1,
  });
});
