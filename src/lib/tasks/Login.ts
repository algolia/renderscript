import type { HTTPRequest } from 'puppeteer-core/lib/esm/puppeteer/api-docs-entry';

import type { LoginTaskParams } from 'lib/types';

import { Task } from './Task';

export class LoginTask extends Task<LoginTaskParams> {
  async process(): Promise<void> {
    /* Setup */
    const { url, waitTime, login, renderHTML } = this.params;
    const { page } = this.page;

    const total = Date.now();
    const minWait = waitTime!.min;
    let body;

    try {
      await this.page.goto(url);
    } catch (err) {
      this.results = {
        error: err.message,
        timeout: Boolean(err.timeout),
      };
      return;
    }

    const textInput = await page!.$('input[type=text], input[type=email]');
    if (!textInput) {
      this.results = {
        error: `field_not_found: input[type=text], input[type=email]`,
      };
      return;
    }

    console.log(`Current URL: ${page!.url()}`);
    console.log('Entering username...');
    await textInput.type(login!.username);

    let passwordInput = await page!.$(
      'input[type=password]:not([aria-hidden="true"])'
    );
    if (!passwordInput) {
      console.log('No password input found: validating username...');
      try {
        await Promise.all([
          // page!.waitForNavigation(), // Doesn't work with Okta for example, it's JS based
          page!.waitForSelector(
            'input[type=password]:not([aria-hidden="true"])',
            {
              timeout: waitTime!.max!,
            }
          ),
          textInput!.press('Enter'),
        ]);
        console.log(`Current URL: ${page!.url()}`);
        passwordInput = await page!.$(
          'input[type=password]:not([aria-hidden="true"])'
        );
      } catch (err) {
        console.log('Found no password input on the page');
        if (renderHTML) {
          body = await this.page.renderBody(new URL(page!.url()));
        }

        this.results = {
          error: err.message,
          body,
        };
        return;
      }
    }

    console.log('Entering password and logging in...');
    await passwordInput!.type(login!.password);
    let loginResponse;
    try {
      const [navigationResponse] = await Promise.all([
        page!.waitForNavigation({
          timeout: waitTime!.max!,
          waitUntil: 'networkidle0',
        }),
        passwordInput!.press('Enter'),
      ]);
      loginResponse = navigationResponse;
    } catch (err) {
      console.log(
        `Error while logging in: ${err.message} (url=${page!.url()})`
      );
      if (renderHTML) {
        body = await this.page.renderBody(new URL(page!.url()));
      }

      this.results = {
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
      if (page!.url() === url.href) {
        // Return an error if we got no login response and are still on the same URL
        console.log(`Got no login response (url=${page!.url()})`);
        if (renderHTML) {
          body = await this.page.renderBody(new URL(page!.url()));
        }

        this.results = {
          error: 'no_response',
          body,
        };
        return;
      }
      // Can happen if navigation was done through History API
      console.log(
        `Got no login response, but we were redirected on ${page!.url()}, continuing...`
      );
    }

    const currentDuration = Date.now() - total;
    if (minWait && minWait > currentDuration) {
      console.log(`Waiting ${minWait - currentDuration} extra ms...`);
      await page!.waitForTimeout(minWait - currentDuration);
    }

    const cookies = await page!.cookies();

    if (renderHTML) {
      body = await this.page.renderBody(new URL(page!.url()));
    }

    this.results = {
      statusCode: loginResponse?.status() || 200,
      headers: loginResponse?.headers(),
      body,
      cookies,
    };
  }
}
