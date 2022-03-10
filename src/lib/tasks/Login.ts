import type { ElementHandle, Response, Request } from 'playwright';

import { report } from 'helpers/errorReporting';
import type { LoginTaskParams } from 'lib/types';

import { Task } from './Task';

export class LoginTask extends Task<LoginTaskParams> {
  async process(): Promise<void> {
    if (!this.page) {
      throw new Error('Calling process before createContext()');
    }

    /* Setup */
    const { url, login } = this.params;
    const log = this.log;
    const page = this.page.page!;
    let response: Response;

    try {
      response = await this.page.goto(url.href, {
        timeout: this.timeBudget.get(),
        waitUntil: 'networkidle',
      });
    } catch (err: any) {
      this.results.error = err.message;
      return;
    }

    this.setMetric('goto');
    await this.saveStatus(response);

    // We first check if there is form
    const textInput = await page.$('input[type=text], input[type=email]');
    if (!textInput) {
      this.results.error = `field_not_found: input[type=text], input[type=email]`;
      return;
    }

    log.debug('Current URL', { pageUrl: page.url() });
    log.info('Entering username...', { userName: login.username });
    await textInput.type(login.username, {
      timeout: this.timeBudget.get(),
    });
    this.timeBudget.consume();

    // Get the password input
    const passwordInput = await this.#getPasswordInput(textInput);
    if (!passwordInput) {
      await this.saveStatus(response);

      return;
    }

    // Type the password
    log.debug('Entering password and logging in...');
    await passwordInput.type(login.password);

    // Submit
    await this.#submitForm(passwordInput);

    await this.saveStatus(response);
    if (this.results.error) {
      return;
    }

    await this.minWait();

    await this.saveStatus(response);

    /* Transforming */
    this.results.resolvedUrl = page.url();
    this.results.cookies = await page.context().cookies();
    const body = await page.content();
    this.results.body = body;
    this.setMetric('serialize');
  }

  /**
   * Get password input.
   */
  async #getPasswordInput(
    textInput: ElementHandle<HTMLElement | SVGElement>
  ): Promise<ElementHandle<HTMLElement | SVGElement> | null | void> {
    const log = this.log;
    const page = this.page!.page!;
    const inputSel = 'input[type=password]:not([aria-hidden="true"])';

    const passwordInput = await page!.$(inputSel);
    if (passwordInput) {
      return passwordInput;
    }

    // it can be that we are in a "two step form"
    log.info('No password input found: validating username...');
    try {
      // We submit the form
      await textInput!.press('Enter', {
        timeout: this.timeBudget.limit(1000),
      });
      this.timeBudget.consume();

      // And wait for a new input to be there maybe
      // page!.waitForNavigation() doesn't work with Okta for example, it's JS based
      await page.waitForSelector(inputSel, {
        timeout: this.timeBudget.limit(1000),
      });
      this.timeBudget.consume();

      log.debug('Current URL', { pageUrl: page.url() });

      return await page.$(inputSel);
    } catch (err: any) {
      log.info('No password input on the page', {
        err: err.message,
        pageUrl: page.url(),
      });

      this.results.error = err.message;
    }
  }

  /**
   * Submit form and wait for response or something to happen.
   */
  async #submitForm(
    passwordInput: ElementHandle<HTMLElement | SVGElement>
  ): Promise<void> {
    const log = this.log;
    const { url } = this.params;
    const page = this.page!.page!;
    let res: Response | null;

    try {
      // We don't submit form directly because sometimes there are no form
      // We wait both at the same time because navigation happens quickly
      [res] = await Promise.all([
        this.page!.waitForNavigation({
          timeout: this.timeBudget.limit(5000),
          waitUntil: 'domcontentloaded',
        }),
        passwordInput.press('Enter', {
          timeout: this.timeBudget.limit(1000),
        }),
      ]);
    } catch (err: any) {
      report(new Error('Error while submit'), {
        err: err.message,
        pageUrl: page.url(),
      });
      this.results.error = err.message;
      return;
    } finally {
      this.timeBudget.consume();
    }

    if (!res) {
      if (page.url() === url.href) {
        // Return an error if we got no login response and are still on the same URL
        this.results.error = 'no_response';
        return;
      }

      // Can happen if navigation was done through History API
      log.debug('No login response, but redirected', { pageUrl: page.url() });
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
    log.debug('Login after redirections', { pageUrl: page.url(), chain });
  }
}
