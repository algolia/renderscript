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
    return {
      error: 'too_many_fields',
      rawError: new Error(
        `Too many input found for "${sel}", found "${count}"`
      ),
    };
  }

  return textInputLoc;
}
