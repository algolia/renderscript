import type { Cookie } from 'playwright';

import { sendLoginRequest } from './helpers';

describe('login', () => {
  it('should error when no username', async () => {
    const { res, body } = await sendLoginRequest({
      url: 'http://localhost:3000/secure/login',
      username: '',
      password: 'password',
    });

    expect(res.statusCode).toBe(400);

    expect(JSON.parse(body)).toEqual({
      details: [
        {
          label: 'username',
          message: 'username is required',
          type: 'required',
        },
      ],
      error: true,
      message: 'Bad Request',
    });
  });

  it('should error when no password', async () => {
    const { res, body } = await sendLoginRequest({
      url: 'http://localhost:3000/secure/login',
      username: 'admin',
      password: '',
    });

    expect(res.statusCode).toBe(400);

    expect(JSON.parse(body)).toEqual({
      details: [
        {
          label: 'password',
          message: 'password is required',
          type: 'required',
        },
      ],
      error: true,
      message: 'Bad Request',
    });
  });

  it('should works with correct credentials', async () => {
    const { res, body } = await sendLoginRequest({
      url: 'http://localhost:3000/secure/login',
      username: 'admin',
      password: 'password',
    });

    expect(res.statusCode).toBe(200);

    const cookies: Cookie[] = JSON.parse(body).cookies;
    expect(
      cookies.find((cookie) => cookie.name === 'sessionToken')
    ).toMatchSnapshot();
    // Check that we actually went through the form
    expect(cookies.find((cookie) => cookie.name === '_csrf')).toBeDefined();
  });

  it('should works even with a 2-steps login', async () => {
    const { res, body } = await sendLoginRequest({
      url: 'http://localhost:3000/secure/login/step1',
      username: 'admin',
      password: 'password',
    });

    expect(res.statusCode).toBe(200);

    const cookies: Cookie[] = JSON.parse(body).cookies;
    expect(
      cookies.find((cookie) => cookie.name === 'sessionToken')
    ).toMatchSnapshot();
    // Check that we actually went through the form
    expect(cookies.find((cookie) => cookie.name === '_csrf')).toBeDefined();
  });

  it('should works with a 2-steps JS login', async () => {
    const { res, body } = await sendLoginRequest({
      url: 'http://localhost:3000/secure/login/2steps',
      username: 'admin',
      password: 'password',
    });

    expect(res.statusCode).toBe(200);

    const cookies: Cookie[] = JSON.parse(body).cookies;
    expect(
      cookies.find((cookie) => cookie.name === 'sessionToken')
    ).toMatchSnapshot();
    // Check that we actually went through the form
    expect(cookies.find((cookie) => cookie.name === '_csrf')).toBeDefined();
  });

  it('should works but not get a session token with bad credentials', async () => {
    const { res, body } = await sendLoginRequest({
      url: 'http://localhost:3000/secure/login',
      username: 'admin',
      password: 'admin',
    });

    expect(res.statusCode).toBe(200);

    const cookies: Cookie[] = JSON.parse(body).cookies;
    expect(
      cookies.find((cookie) => cookie.name === 'sessionToken')
    ).toBeUndefined();
    // Check that we actually went through the form
    expect(cookies.find((cookie) => cookie.name === '_csrf')).toBeDefined();
  });
});

describe('JavaScript redirect', () => {
  it('should fail to renderHTML because of the JS redirect', async () => {
    const { res, body } = await sendLoginRequest({
      url: 'http://localhost:3000/secure/login?redirect=true',
      username: 'admin',
      password: 'password',
      renderHTML: 'true',
    });

    // Page rending crashes because of the JS redirection (c.f. _renderLoginResult()), with the following error:
    // Error: Execution context was destroyed, most likely because of a navigation.
    expect(res.statusCode).toBe(500);

    const jsonBody = JSON.parse(body);
    expect(jsonBody.error).toBe('Invalid status code: undefined');
  });

  it('should not try to render the body if renderHTML was not requested', async () => {
    const { res, body } = await sendLoginRequest({
      url: 'http://localhost:3000/secure/login?redirect=true',
      username: 'admin',
      password: 'password',
    });

    // Since we didn't try to render, it returns the current cookies, even if there is an ongoing JS redirection
    expect(res.statusCode).toBe(200);

    const jsonBody = JSON.parse(body);
    expect(jsonBody.body).toBeUndefined();
  });
});
