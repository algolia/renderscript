import { setTimeout } from 'timers/promises';

import { log } from 'helpers/logger';
import type { BrowserPage } from 'lib/browser/Page';

// waitForNavigation({ waitUntil: 'networkidle' }) or waitForLoadState('networkidle')
// can be flaky and return too soon:
// https://github.com/microsoft/playwright/issues/4664#issuecomment-742691215
// https://github.com/microsoft/playwright/issues/2515#issuecomment-724163391
// This helper permits to manually wait, if the page still has pending requests.
export async function waitForPendingRequests(
  page: BrowserPage,
  timeout: number
): Promise<void> {
  const startTime = Date.now();
  while (page.pendingRequests > 0 && Date.now() - startTime < timeout) {
    log.debug(
      { pageUrl: page.ref?.url() },
      `Waiting for ${page.pendingRequests} requests to complete... Wait time:${
        Date.now() - startTime
      }, timeout: ${timeout}`
    );
    await setTimeout(1000);
  }
}
