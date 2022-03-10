import type { Cookie } from 'playwright-chromium';

import type { PostLoginSuccess } from 'api/@types/postLogin';
import type { PostRenderSuccess } from 'api/@types/postRender';

import {
  cleanCookies,
  cookiesToString,
  postRender,
  sendLoginRequest,
} from './helpers';

const rawCreds = process.env.LOGIN_CREDENTIALS;
const canExec = process.env.CI || rawCreds;

jest.setTimeout(25000);
// Not working right now
// eslint-disable-next-line jest/no-disabled-tests
describe.skip('Real Login', () => {
  let creds: { [name: string]: { username: string; password: string } };

  beforeAll(() => {
    if (!canExec) {
      throw new Error('can only exec in CI or with LOGIN_CREDENTIALS');
    }

    creds = JSON.parse(rawCreds!);
  });

  describe('login.live.com', () => {
    let cookies: Cookie[];
    let cred: { username: string; password: string };
    beforeAll(() => {
      cred = creds['login.live.com'];
    });

    it('should not be logged', async () => {
      const { res, body } = await postRender({
        url: 'https://account.microsoft.com/billing/orders?refd=account.microsoft.com',
      });

      expect(res.statusCode).toBe(200);
      const parsed: PostRenderSuccess = JSON.parse(body);
      expect(parsed.statusCode).toBe(302);
      expect(
        parsed.resolvedUrl?.startsWith('https://login.live.com/login.srf')
      ).toBe(true);
    });

    it('get proper cookies', async () => {
      const { res, body } = await sendLoginRequest({
        url: 'https://account.microsoft.com/billing/orders?refd=account.microsoft.com',
        username: cred.username,
        password: cred.password,
      });

      expect(res.statusCode).toBe(200);
      const parsed: PostLoginSuccess = JSON.parse(body);
      const tmp = cleanCookies(parsed.cookies);
      [
        { domain: '.account.live.com', name: 'RPSMaybe', path: '/' },
        { domain: '.account.microsoft.com', name: 'AMCSecAuth', path: '/' },
        { domain: '.account.microsoft.com', name: 'ANON', path: '/' },
        { domain: '.account.microsoft.com', name: 'NAP', path: '/' },
        { domain: '.live.com', name: 'amsc', path: '/' },
        { domain: '.live.com', name: 'ANON', path: '/' },
        { domain: '.live.com', name: 'mkt', path: '/' },
        { domain: '.live.com', name: 'mkt1', path: '/' },
        { domain: '.live.com', name: 'MSPAuth', path: '/' },
        { domain: '.live.com', name: 'MSPProf', path: '/' },
        { domain: '.live.com', name: 'NAP', path: '/' },
        { domain: '.live.com', name: 'PPLState', path: '/' },
        { domain: '.live.com', name: 'wlidperf', path: '/' },
        { domain: '.live.com', name: 'WLSSC', path: '/' },
        { domain: '.login.live.com', name: 'JSH', path: '/' },
        { domain: '.login.live.com', name: 'JSHP', path: '/' },
        { domain: '.login.live.com', name: 'MSCC', path: '/' },
        { domain: '.login.live.com', name: 'MSPBack', path: '/' },
        { domain: '.login.live.com', name: 'MSPOK', path: '/' },
        { domain: '.login.live.com', name: 'MSPRequ', path: '/' },
        { domain: '.login.live.com', name: 'MSPRequ', path: '/' },
        { domain: '.login.live.com', name: 'MSPSoftVis', path: '/' },
        { domain: '.login.live.com', name: 'OParams', path: '/' },
        { domain: '.login.live.com', name: 'SDIDC', path: '/' },
        { domain: '.login.live.com', name: 'uaid', path: '/' },
        { domain: '.login.live.com', name: 'uaid', path: '/' },
        { domain: '.microsoft.com', name: 'display-culture', path: '/' },
        { domain: '.microsoft.com', name: 'market', path: '/' },
        { domain: 'account.microsoft.com', name: 'ai_session', path: '/' },
        { domain: 'account.microsoft.com', name: 'AMC-MS-CV', path: '/' },
        { domain: 'account.microsoft.com', name: 'authBounced', path: '/' },
        { domain: 'account.microsoft.com', name: 'canary', path: '/' },
        { domain: 'account.microsoft.com', name: 'GRNID', path: '/' },
        { domain: 'account.microsoft.com', name: 'GroupIds', path: '/' },
        { domain: 'account.microsoft.com', name: 'ShCLSessionID', path: '/' },
        // { domain: 'login.live.com', name: '__Host-MSAAUTH', path: '/' }, seems optional
        { domain: 'login.live.com', name: '__Host-MSAAUTHP', path: '/' },
      ].forEach((cookie) => {
        expect(
          tmp.find((c) => c.name === cookie.name && c.domain === cookie.domain)
        ).toStrictEqual(cookie);
      });

      cookies = parsed.cookies;
    });

    it('should be logged', async () => {
      const { res, body } = await postRender(
        {
          url: 'https://account.microsoft.com/billing/orders?refd=account.microsoft.com',
        },
        {
          Cookie: cookiesToString(cookies),
        }
      );

      expect(res.statusCode).toBe(200);
      const parsed: PostRenderSuccess = JSON.parse(body);
      console.log(parsed);
      expect(parsed.statusCode).toBe(200);
    });
  });
});
