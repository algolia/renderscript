import type { PostRenderSuccess } from 'api/@types/postRender';
import type { BrowserEngine } from 'lib/browser/Browser';

import { postRender } from './helpers';

jest.setTimeout(60000);

describe('errors', () => {
  it('should catch DNS error', async () => {
    const { res, body } = await postRender({
      url: 'http://thisisnota-domain.thistld.does.not.exist',
      ua: 'Algolia Crawler',
    });

    const json: PostRenderSuccess = JSON.parse(body);
    expect(res.statusCode).toBe(200);
    expect(json.body).toBeNull();
    expect(json.error).toBe('dns_error');
  });

  it.each(['chromium', 'firefox'])(
    '%s should catch Page Crashed',
    async (browser) => {
      const { res, body } = await postRender({
        url: 'http://localhost:3000/test-website/page-crash.html',
        ua: 'Algolia Crawler',
        browser: browser as BrowserEngine,
        waitTime: {
          max: 20000,
        },
      });

      const json: PostRenderSuccess = JSON.parse(body);
      expect(res.statusCode).toBe(500);
      expect(json.body).toBeNull();
      expect(json.error).toBe('body_serialisation_failed');
    }
  );
});
