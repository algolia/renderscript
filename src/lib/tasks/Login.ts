import type { HTTPRequest } from 'puppeteer-core/lib/esm/puppeteer/api-docs-entry';

import type Renderer from 'lib/Renderer';
import { TIMEOUT } from 'lib/constants';
import type { LoginTaskParams, NewPage } from 'lib/types';

import { Task } from './Task';

export class LoginTask extends Task {
  task;
  pageContext;
  renderer;

  constructor(task: LoginTaskParams, pageContext: NewPage, renderer: Renderer) {
    super();
    this.task = task;
    this.pageContext = pageContext;
    this.renderer = renderer;
  }

  async process(): Promise<void> {
    /* Setup */
    const { url } = this.task;
    const { context, page } = this.pageContext;

    try {
      await this.renderer.goto(page, url);
    } catch (err) {
      this._results = {
        error: err.message,
        timeout: Boolean(err.timeout),
      };
      return;
    }

    const textInput = await page.$('input[type=text], input[type=email]');
    if (!textInput) {
      this._results = {
        error: `field_not_found: input[type=text], input[type=email]`,
      };
      return;
    }

    await textInput.type(this.task.login!.username);

    let passwordInput = await page.$('input[type=password]');
    if (!passwordInput) {
      console.log('2 step login: validating username...');
      try {
        await Promise.all([
          // page.waitForNavigation(), // Doesn't work with Okta for example, it's JS based
          page.waitForSelector('input[type=password]', {
            timeout: TIMEOUT,
          }),
          textInput!.press('Enter'),
        ]);
        console.log(`2 step login: navigated to ${page.url()}`);
        passwordInput = await page.$('input[type=password]');
      } catch (err) {
        console.log('Found no password input on the page');
        const body = await this.renderer.renderBody(page, new URL(page.url()));

        this._results = {
          error: err.message,
          body,
        };
        return;
      }
    }

    console.log('Logging in...');
    await passwordInput!.type(this.task.login!.password);
    let loginResponse;
    try {
      const [navigationResponse] = await Promise.all([
        page.waitForNavigation({ timeout: TIMEOUT }),
        passwordInput!.press('Enter'),
      ]);
      loginResponse = navigationResponse;
    } catch (err) {
      console.log(`Error while logging in: ${err.message} (url=${page.url()})`);
      const body = await this.renderer.renderBody(page, new URL(page.url()));

      this._results = {
        error: err.message,
        body,
      };
      return;
    }

    if (loginResponse) {
      const chain = loginResponse.request().redirectChain();
      console.log(`Followed ${chain.length} redirections`);
      chain.forEach((request: HTTPRequest) => {
        console.log(`--> ${request.url()}`);
      });
    } else {
      if (page.url() === url.href) {
        // Return an error if we got no login response and are still on the same URL
        console.log(`Got no login response (url=${page.url()})`);
        const body = await this.renderer.renderBody(page, new URL(page.url()));

        this._results = {
          error: 'no_response',
          body,
        };
        return;
      }
      // Can happen if navigation was done through History API
      console.log(
        `Got no login response, but we were redirected on ${page.url()}, continuing...`
      );
    }

    const cookies = await page.cookies();

    const body = await this.renderer.renderBody(page, new URL(page.url()));

    /* Cleanup */
    await context.close();

    this._results = {
      statusCode: loginResponse?.status() || 200,
      headers: loginResponse?.headers(),
      body,
      cookies,
    };
  }
}