import type {
  ElementHandle,
  Response,
  Request,
  Locator,
} from 'playwright-chromium';

import { report } from 'helpers/errorReporting';
import { cleanErrorMessage } from 'lib/helpers/errors';
import { getInput } from 'lib/helpers/getInput';
import type { LoginTaskParams } from 'lib/types';

import { Task } from './Task';

const usernameSelectors = [
  'input[type=email][id*=login i]',
  'input[type=email][name*=login i]',
  'input[type=text][id*=login i]',
  'input[type=text][id*=email i]',
  'input[type=text][id*=username i]',
  'input[type=text][name*=login i]',
  'input[type=text][name*=email i]',
  'input[type=text][name*=username i]',
  'input[type=email]',
  'input[type=text]',
];
const passwordSel = 'input[type=password]:not([aria-hidden="true"])';

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
      return this.throwHandledError({ error: err.message, rawError: err });
    } finally {
      this.setMetric('goto');
    }

    await this.saveStatus(response);

    const usernameInput = await this.#typeUsername();
    await this.saveStatus(response);

    // Get the password input
    const passwordInput = await this.#typePasswordInput({
      textInput: usernameInput!,
      step: '1',
    });
    await this.saveStatus(response);

    // Submit
    await this.#submitForm(passwordInput!);

    await this.saveStatus(response);

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
      return this.throwHandledError({ error: 'no_cookies' });
    }

    const body = await this.page.renderBody();
    this.results.body = body;
    this.setMetric('serialize');
  }

  /**
   * Get username input and type the value in it.
   */
  async #typeUsername(): Promise<ElementHandle<
    HTMLElement | SVGElement
  > | void> {
    const { log, page, params } = this;
    const { login } = params;

    try {
      // We first check if there is form
      // Try mutliple selector from the most to less precise
      let usernameInputLoc: Locator | null = null;
      for (const usernameSel of usernameSelectors) {
        const input = await getInput(page, usernameSel);
        if ('error' in input) {
          continue;
        }
        usernameInputLoc = input;
      }
      if (!usernameInputLoc) {
        return this.throwHandledError({
          error: 'field_not_found',
          rawError: new Error('Username field not found'),
        });
      }
      if ('error' in usernameInputLoc) {
        return this.throwHandledError(usernameInputLoc);
      }

      log.info('Entering username...', { userName: login.username });

      const usernameInput = await usernameInputLoc.elementHandle({
        timeout: 500,
      });
      await usernameInput?.type(login.username, {
        noWaitAfter: true,
        timeout: this.timeBudget.getRange(2000, 3000),
      });

      return usernameInput!;
    } finally {
      this.timeBudget.consume();
    }
  }

  /**
   * Get password input.
   */
  async #typePasswordInput({
    textInput,
    step,
  }: {
    textInput: ElementHandle<HTMLElement | SVGElement>;
    step: '1' | '2';
  }): Promise<ElementHandle<HTMLElement | SVGElement> | null | void> {
    const { page, params } = this;
    const { login } = params;

    try {
      // Find the input
      const passwordInputLoc = await getInput(page, passwordSel);
      if (!('error' in passwordInputLoc)) {
        await passwordInputLoc.type(login.password, {
          noWaitAfter: true,
          timeout: this.timeBudget.getRange(2000, 3000),
        });

        return passwordInputLoc.elementHandle();
      }

      if (passwordInputLoc.error === 'too_many_fields') {
        return this.throwHandledError(passwordInputLoc);
      }

      if (step === '2' && passwordInputLoc.error === 'field_not_found') {
        return this.throwHandledError(passwordInputLoc);
      }

      return await this.#handleFirstStepForm({ textInput });
    } finally {
      this.timeBudget.consume();
    }
  }

  /**
   * Try to submit first step form to get the password input.
   */
  async #handleFirstStepForm({
    textInput,
  }: {
    textInput: ElementHandle<HTMLElement | SVGElement>;
  }): Promise<ElementHandle<HTMLElement | SVGElement> | null | void> {
    const log = this.log;

    // It can be that we are in a "two step form"
    log.info('No password input found: validating username...');

    // Submit the form to see if the second step appears
    await textInput.press('Enter', {
      noWaitAfter: true,
      timeout: this.timeBudget.getRange(2000, 3000),
    });
    this.timeBudget.consume();

    // And wait for a new input to be there maybe
    // page!.waitForNavigation() doesn't work with Okta for example, it's JS based
    await this.page!.ref?.waitForSelector(passwordSel, {
      timeout: this.timeBudget.min(3000),
    });
    this.timeBudget.consume();

    log.debug('Current URL', { pageUrl: this.page!.ref?.url() });
    return this.#typePasswordInput({ textInput, step: '2' });
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
      log.debug(`Submit login form`);
      // We don't submit form directly because sometimes there are no form
      // We wait both at the same time because navigation happens quickly
      [res] = await Promise.all([
        this.page!.waitForNavigation({
          timeout: this.timeBudget.min(3000),
          waitUntil: 'domcontentloaded',
        }),
        passwordInput.press('Enter', {
          noWaitAfter: true,
          timeout: this.timeBudget.getRange(2000, 3000),
        }),
      ]);
    } catch (err: any) {
      this.page!.throwIfNotTimeout(err);
    } finally {
      this.timeBudget.consume();
    }

    try {
      log.debug(`Login wait for network idle`);

      // After it is submit there can quite a lof ot redirections so we wait a bit more
      // we could do it before but it's easier to split domcontentloaded and networkidle for debug
      const [resAfterNetwork] = await Promise.all([
        this.page!.waitForNavigation({
          timeout: this.timeBudget.min(5000),
          waitUntil: 'networkidle',
        }),
      ]);
      if (resAfterNetwork) {
        // if no navigation happened resAfterNetwork is nul
        // but we don't want to erase res because it is most of the time normal if we already reached the final page
        res = resAfterNetwork;
      }
    } catch (err: any) {
      report(new Error('Error waiting to submit form'), {
        err: err.message,
        pageUrl: this.page!.ref?.url(),
      });
      return this.throwHandledError({
        error: cleanErrorMessage(err),
        rawError: err,
      });
    } finally {
      this.timeBudget.consume();
    }

    const hasSpecialCase = this.#needSpecialCase();
    if (hasSpecialCase) {
      log.debug(`Login wait for spec`);
      try {
        const [resAfterSpec] = await Promise.all([
          this.page!.waitForNavigation({
            timeout: this.timeBudget.min(5000),
            waitUntil: 'networkidle',
          }),
          this.#handleSpecialCaseForm({ name: hasSpecialCase }),
        ]);
        if (resAfterSpec) {
          res = resAfterSpec;
        }
      } catch (err: any) {
        this.page!.throwIfNotTimeout(err);
      } finally {
        this.timeBudget.consume();
      }
    }

    if (!res) {
      if (this.page!.ref?.url() === url.href) {
        // Return an error if we got no login response and are still on the same URL
        return this.throwHandledError({ error: 'no_response_after_login' });
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

  #needSpecialCase(): 'login.live.com' | false {
    if (!this.page?.ref) {
      return false;
    }

    const currentUrl = this.page.ref.url();
    if (currentUrl.startsWith('https://login.live.com')) {
      return 'login.live.com';
    }

    return false;
  }

  async #handleSpecialCaseForm({
    name,
  }: {
    name: 'login.live.com';
  }): Promise<void> {
    const { log } = this;
    if (!this.page?.ref) {
      return;
    }

    // Spec for Microsoft SSO
    if (name === 'login.live.com') {
      log.debug('MSFT: Entering specs');

      // There is a "Keep me sign in?" checkbox now
      const confirm = this.page.ref.locator('#KmsiCheckboxField');
      const submit = this.page.ref.locator('input[type=submit]');

      if ((await confirm.count()) === 1 && (await submit.count()) === 1) {
        log.debug('MSFT: found confirm and submit');

        await confirm.click({
          timeout: this.timeBudget.getRange(200, 500),
          noWaitAfter: true, // Otherwise wait for navigation
        });

        await submit.click({
          timeout: this.timeBudget.getRange(200, 500),
          noWaitAfter: true, // Otherwise wait for navigation
        });
      }
    }
  }
}
