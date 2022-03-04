import type { ElementHandle, Response, Request } from 'playwright';

import type { LoginTaskParams } from 'lib/types';

import { Task } from './Task';

export class LoginTask extends Task<LoginTaskParams> {
  async process(): Promise<void> {
    await this.createContext();
    if (!this.page) {
      return;
    }

    /* Setup */
    const { url, waitTime, login } = this.params;
    const page = this.page.page!;
    let response: Response;

    try {
      response = await this.page.goto(url.href, {
        timeout: waitTime!.max,
        waitUntil: 'networkidle',
      });
    } catch (err: any) {
      this.results.error = err.message;
      return;
    }

    await this.saveStatus(response);

    // We first check if there is form
    const textInput = await page!.$('input[type=text], input[type=email]');
    if (!textInput) {
      this.results.error = `field_not_found: input[type=text], input[type=email]`;
      return;
    }

    console.log(`Current URL: ${page!.url()}`);
    console.log('Entering username...');
    await textInput.type(login!.username);

    // Get the password input
    const passwordInput = await this.#getPasswordInput(textInput);
    if (!passwordInput) {
      await this.saveStatus(response);

      return;
    }

    // Type the password
    console.log('Entering password and logging in...');
    await passwordInput!.type(login!.password);

    // Submit
    await this.#submitForm(passwordInput);

    await this.saveStatus(response);

    await this.minWait();

    const cookies = await page.context().cookies();

    await this.saveStatus(response);

    this.results.cookies = cookies;
  }

  /**
   * Get password input.
   */
  async #getPasswordInput(
    textInput: ElementHandle<HTMLElement | SVGElement>
  ): Promise<ElementHandle<HTMLElement | SVGElement> | null | void> {
    const page = this.page!.page!;

    const inputSel = 'input[type=password]:not([aria-hidden="true"])';
    const passwordInput = await page!.$(inputSel);
    if (passwordInput) {
      return passwordInput;
    }

    // it can be that we are in a "two step form"
    console.log('No password input found: validating username...');
    try {
      // We submit the form
      await textInput!.press('Enter');

      // And wait for a new input to be there maybe
      // page!.waitForNavigation() doesn't work with Okta for example, it's JS based
      await page.waitForSelector(inputSel, {
        timeout: this.params.waitTime!.min,
      });

      console.log(`Current URL: ${page.url()}`);

      return await page.$(inputSel);
    } catch (err: any) {
      console.log(
        'Found no password input on the page',
        JSON.stringify({
          err: err.message,
          pageUrl: page.url(),
        })
      );

      this.results.error = err.message;
    }
  }

  /**
   * Submit form and wait for response or something to happen.
   */
  async #submitForm(
    passwordInput: ElementHandle<HTMLElement | SVGElement>
  ): Promise<void> {
    const { url } = this.params;
    const page = this.page!.page!;
    let res;

    try {
      // We don't submit form because sometimes there are no form
      await passwordInput.press('Enter');

      res = await page.waitForNavigation({
        timeout: this.params.waitTime!.min,
        waitUntil: 'networkidle',
      });
    } catch (err: any) {
      console.log(
        'Error while logging in',
        JSON.stringify({
          err: err.message,
          pageUrl: page.url(),
        })
      );

      this.results.error = err.message;
      return;
    }

    if (!res) {
      if (page.url() !== url.href) {
        // Can happen if navigation was done through History API
        console.log(
          `Got no login response, but we were redirected on ${page!.url()}, continuing...`
        );
      }

      // Return an error if we got no login response and are still on the same URL
      console.log(
        'Got no login response',
        JSON.stringify({
          url: page.url(),
        })
      );

      this.results.error = 'no_response';
      return;
    }

    // Computing redirection chain.
    const chain = [];
    let prev: Request | null = res.request();
    while (prev) {
      prev = prev.redirectedFrom();
      if (!prev) {
        prev = null;
        break;
      }
      chain.push(prev.url());
    }

    console.log(
      `Followed ${chain.length} redirections`,
      JSON.stringify({
        url: page.url(),
        chain,
      })
    );
  }
}
