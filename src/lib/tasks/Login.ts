import type { ElementHandle, Response, Request } from 'playwright-chromium';

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
    const textInputLoc = page.locator('input[type=text], input[type=email]');
    if ((await textInputLoc.count()) <= 0) {
      this.results.error = `field_not_found: input[type=text], input[type=email]`;
      return;
    }

    log.debug('Current URL', { pageUrl: page.url() });
    log.info('Entering username...', { userName: login.username });
    const elTextInput = (await textInputLoc.elementHandle())!;
    await elTextInput.type(login.username, {
      timeout: this.timeBudget.get(),
    });
    this.timeBudget.consume();

    // Get the password input
    const passwordInput = await this.#getPasswordInput(elTextInput);
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
    // we get the cookie for the requested domain
    // this is not ideal for some SSO, returning valid cookies but missing some of them
    this.results.cookies = await page.context().cookies([url.href]);
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

    const passwordInputLoc = page.locator(inputSel);
    if ((await passwordInputLoc.count()) > 0) {
      return await passwordInputLoc.elementHandle();
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

      const loc = page.locator(inputSel);
      if ((await loc.count()) > 0) {
        return await loc.elementHandle();
      }
    } catch (err: any) {
      log.info('No password input on the page', {
        err: err.message,
        pageUrl: page.url(),
      });

      this.results.error = err.message;
    }

    return null;
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
          timeout: this.timeBudget.limit(3000),
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
      this.results.error = err.message;
      report(new Error('Error while spec'), {
        err: err.message,
        pageUrl: page.url(),
      });
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

  async #handleSpecForm(): Promise<void> {
    const { log } = this;
    const page = this.page!.page!;
    const currentUrl = page.url();

    // Spec for Microsoft SSO
    if (currentUrl.startsWith('https://login.live.com')) {
      log.debug('MSFT: Entering specs');

      // There is a "Keep me sign in?" checkbox now
      const confirm = page.locator('#KmsiCheckboxField');
      const submit = page.locator('input[type=submit]');

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
