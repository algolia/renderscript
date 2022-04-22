import type {
  ElementHandle,
  Response,
  Request,
  Locator,
} from 'playwright-chromium';

import { report } from 'helpers/errorReporting';
import { cleanErrorMessage } from 'lib/helpers/errors';
import type { LoginTaskParams } from 'lib/types';

import { Task } from './Task';

export class LoginTask extends Task<LoginTaskParams> {
  async process(): Promise<void> {
    if (!this.page) {
      throw new Error('Calling process before createContext()');
    }

    /* Setup */
    const { url } = this.params;
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
    const usernameInputLoc = await this.#checkForm();
    if (this.results.error || !usernameInputLoc) {
      return;
    }

    const usernameInput = await this.#typeUsername(usernameInputLoc);
    if (this.results.error || !usernameInput) {
      return;
    }

    // Get the password input
    const passwordInput = await this.#typePasswordInput(usernameInput);
    this.saveStatus(response);
    if (this.results.error || !passwordInput) {
      return;
    }

    // Submit
    await this.#submitForm(passwordInput);
    await this.saveStatus(response);
    if (this.results.error) {
      return;
    }

    await this.minWait();

    await this.saveStatus(response);

    if (!this.page.ref) {
      return;
    }

    /* Transforming */
    this.results.resolvedUrl = this.page.ref.url();
    // we get the cookie for the requested domain
    // this is not ideal for some SSO, returning valid cookies but missing some of them
    this.results.cookies = await this.page.ref
      ?.context()
      .cookies([url.href, this.results.resolvedUrl]);

    if (this.results.cookies.length <= 0) {
      this.results.error = 'no_cookies';
      return;
    }

    const body = await this.page.renderBody();
    this.results.body = body;
    this.setMetric('serialize');
  }

  /**
   * Check if there is an usable form in the page.
   */
  async #checkForm(): Promise<Locator | void> {
    const textInputLoc = this.page?.ref?.locator(
      'input[type=text], input[type=email]'
    );
    if (!textInputLoc || (await textInputLoc.count()) <= 0) {
      this.results.error = 'field_not_found';
      this.results.rawError = new Error('input[type=text], input[type=email]');
      return;
    }

    return textInputLoc;
  }

  /**
   * Get username input and type the value in it.
   */
  async #typeUsername(
    usernameInputLoc?: Locator
  ): Promise<ElementHandle<HTMLElement | SVGElement> | null | undefined> {
    const log = this.log;
    const { login } = this.params;

    try {
      log.debug('Current URL', { pageUrl: this.page?.ref?.url() });
      log.info('Entering username...', { userName: login.username });

      const usernameInput = await usernameInputLoc?.elementHandle({
        timeout: 500,
      });
      await usernameInput?.type(login.username, {
        noWaitAfter: true,
        timeout: this.timeBudget.limit(1000),
      });

      return usernameInput;
    } finally {
      this.timeBudget.consume();
    }
  }

  /**
   * Get password input.
   */
  async #typePasswordInput(
    textInput: ElementHandle<HTMLElement | SVGElement>
  ): Promise<ElementHandle<HTMLElement | SVGElement> | null | void> {
    const { login } = this.params;
    const log = this.log;
    const inputSel = 'input[type=password]:not([aria-hidden="true"])';

    try {
      // Find the input
      let passwordInputLoc = this.page!.ref?.locator(inputSel);

      if (!passwordInputLoc || (await passwordInputLoc.count()) <= 0) {
        // It can be that we are in a "two step form"
        log.info('No password input found: validating username...');

        // Submit the form to see if the second step appears
        await textInput.press('Enter', {
          noWaitAfter: true,
          timeout: this.timeBudget.limit(1000),
        });
        this.timeBudget.consume();

        // And wait for a new input to be there maybe
        // page!.waitForNavigation() doesn't work with Okta for example, it's JS based
        await this.page!.ref?.waitForSelector(inputSel, {
          timeout: this.timeBudget.limit(3000),
        });
        this.timeBudget.consume();

        log.debug('Current URL', { pageUrl: this.page!.ref?.url() });

        passwordInputLoc = this.page!.ref?.locator(inputSel);
      }

      if (!passwordInputLoc || (await passwordInputLoc.count()) <= 0) {
        // Can definitely not find a password input
        this.results.error = 'field_not_found';
        this.results.rawError = new Error(inputSel);
        return;
      }

      // Type the password
      log.debug('Entering password and logging in...');
      await passwordInputLoc.type(login.password, {
        noWaitAfter: true,
        timeout: this.timeBudget.get(),
      });

      return passwordInputLoc?.elementHandle();
    } catch (err: any) {
      await this.page?.close();

      log.info('No password input on the page', {
        err: err.message,
        pageUrl: this.page!.ref?.url(),
      });

      this.results.error = cleanErrorMessage(err);
      this.results.rawError = err;
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
    let res: Response | null = null;

    try {
      // We don't submit form directly because sometimes there are no form
      // We wait both at the same time because navigation happens quickly
      [res] = await Promise.all([
        this.page!.waitForNavigation({
          timeout: this.timeBudget.limit(3000),
          waitUntil: 'domcontentloaded',
        }),
        passwordInput.press('Enter', {
          noWaitAfter: true,
          timeout: this.timeBudget.limit(3000),
        }),
      ]);
    } catch (err: any) {
      this.page!.throwIfNotTimeout(err);
    } finally {
      this.timeBudget.consume();
    }

    try {
      // After it is submit there can quite a lof ot redirections so we wait a bit more
      // we could do it before but it's easier to split domcontentloaded and networkidle for debug
      const [resAfterNetwork] = await Promise.all([
        this.page!.waitForNavigation({
          timeout: this.timeBudget.limit(5000),
          waitUntil: 'networkidle',
        }),
      ]);
      if (resAfterNetwork) {
        // if no navigation happened resAfterNetwork is nul
        // but we don't want to erase res because it is most of the time normal if we already reached the final page
        res = resAfterNetwork;
      }

      const [resAfterSpec] = await Promise.all([
        this.page!.waitForNavigation({
          timeout: this.timeBudget.limit(5000),
          waitUntil: 'networkidle',
        }),
        this.#handleSpecForm(),
      ]);
      if (resAfterSpec) {
        res = resAfterSpec;
      }
    } catch (err: any) {
      this.results.error = cleanErrorMessage(err);
      this.results.rawError = err;
      report(new Error('Error while spec'), {
        err: err.message,
        pageUrl: this.page!.ref?.url(),
      });
      return;
    } finally {
      this.timeBudget.consume();
    }

    if (!res) {
      if (this.page!.ref?.url() === url.href) {
        // Return an error if we got no login response and are still on the same URL
        this.results.error = 'no_response_after_login';
        return;
      }

      // Can happen if navigation was done through History API
      log.debug('No login response, but redirected', {
        pageUrl: this.page!.ref?.url(),
      });
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
    log.debug('Login after redirections', {
      pageUrl: this.page!.ref?.url(),
      chain,
    });
  }

  async #handleSpecForm(): Promise<void> {
    const { log } = this;
    if (!this.page?.ref) {
      return;
    }

    const currentUrl = this.page.ref.url();

    // Spec for Microsoft SSO
    if (currentUrl.startsWith('https://login.live.com')) {
      log.debug('MSFT: Entering specs');

      // There is a "Keep me sign in?" checkbox now
      const confirm = this.page.ref.locator('#KmsiCheckboxField');
      const submit = this.page.ref.locator('input[type=submit]');

      if ((await confirm.count()) === 1 && (await submit.count()) === 1) {
        log.debug('MSFT: found confirm and submit');

        await confirm.click({
          timeout: this.timeBudget.limit(100),
          noWaitAfter: true, // Otherwise wait for navigation
        });

        await submit.click({
          timeout: this.timeBudget.limit(100),
          noWaitAfter: true, // Otherwise wait for navigation
        });
      }
    }
  }
}
