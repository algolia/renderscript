import type { Locator } from 'playwright';

import type { BrowserPage } from '../browser/Page';
import type { HandledError } from '../types';

/**
 * Get input for selector.
 */
export async function getInput(
  page: BrowserPage | undefined,
  sel: string
): Promise<Locator | { error: HandledError; rawError: Error }> {
  const textInputLoc = page?.ref?.locator(sel);

  const count = textInputLoc ? await textInputLoc.count() : 0;
  if (!textInputLoc || count <= 0) {
    return {
      error: 'field_not_found',
      rawError: new Error(`Field not found "${sel}"`),
    };
  }

  if (count > 1) {
    try {
      // sometimes the input is hidden because the page is not fully loaded
      // wait for the page to be fully loaded
      await page?.waitForNavigation({
        waitUntil: 'load',
        timeout: 10000,
      });

      // check again but this time only for visible elements
      const visibleInputLoc = await textInputLoc.locator('visible=true');
      const visibleCount = visibleInputLoc ? await visibleInputLoc.count() : 0;
      if (visibleCount === 1) {
        return visibleInputLoc;
      }

      return {
        error: 'too_many_fields',
        rawError: new Error(
          `Too many input found for "${sel}", found "${count}"`
        ),
      };
    } catch (error) {
      return {
        error: 'page_timeout',
        rawError: new Error(
          `Page timeout while looking for input "${sel}", found "${count}"`
        ),
      };
    }
  }

  return textInputLoc;
}
