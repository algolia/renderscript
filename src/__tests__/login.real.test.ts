import type { PostLoginSuccess } from 'api/@types/postLogin';

import { cleanCookies, sendLoginRequest } from './helpers';

const rawCreds = process.env.LOGIN_CREDENTIALS;
const canExec = process.env.CI || rawCreds;

describe('Real Login', () => {
  let creds: { [name: string]: { username: string; password: string } };
  beforeAll(() => {
    if (!canExec) {
      throw new Error('can only exec in CI or with LOGIN_CREDENTIALS');
    }

    creds = JSON.parse(rawCreds!);
  });

  describe('login.live.com', () => {
    it('Get proper cookies', async () => {
      const cred = creds['login.live.com'];
      const { res, body } = await sendLoginRequest({
        url: 'https://login.live.com',
        username: cred.username,
        password: cred.password,
      });

      expect(res.statusCode).toBe(200);
      const parsed: PostLoginSuccess = JSON.parse(body);
      expect(cleanCookies(parsed.cookies)).toStrictEqual([
        { domain: '.login.live.com', name: 'uaid', path: '/' },
        { domain: '.login.live.com', name: 'MSPRequ', path: '/' },
        { domain: '.login.live.com', name: 'MSCC', path: '/' },
        { domain: '.live.com', name: 'wlidperf', path: '/' },
        { domain: 'login.live.com', name: '__Host-MSAAUTH', path: '/' },
        { domain: '.live.com', name: 'PPLState', path: '/' },
        { domain: '.login.live.com', name: 'OParams', path: '/' },
        { domain: '.login.live.com', name: 'MSPOK', path: '/' },
        { domain: '.microsoft.com', name: 'MC1', path: '/' },
        { domain: '.microsoft.com', name: 'MS0', path: '/' },
      ]);
    });
  });
});
