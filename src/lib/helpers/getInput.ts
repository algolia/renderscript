import type { Locator } from 'playwright';

import type { BrowserPage } from '../browser/Page';
import type { HandledError } from '../types';

/**
 * Check if an element is visible.
 */
function isVisible(element: Element): boolean {
  return window.getComputedStyle(element).display !== 'none';
}

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
    // sometimes there are multiple input fields with the same selector
    // we want to find out if there's a visible one
    const visibleElements = await textInputLoc!.evaluateAll((elements) => {
      return elements.filter(isVisible);
    });

    if (visibleElements.length !== 1) {
      return {
        error: 'too_many_fields',
        rawError: new Error(
          `Too many input found for "${sel}", found "${visibleElements.length}"`
        ),
      };
    }

    const visibleTextInputLoc = textInputLoc.nth(
      await textInputLoc.evaluateAll((elements) =>
        elements.findIndex(isVisible)
      )
    );
    return visibleTextInputLoc;
  }

  return textInputLoc;
}
