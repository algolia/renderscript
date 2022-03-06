import { validateURL } from '@algolia/dns-filter';

import { report } from 'helpers/errorReporting';
import { VALIDATE_URL_IGNORED_ERRORS } from 'lib/browser/constants';
import { RESTRICTED_IPS } from 'lib/constants';

export async function isURLAllowed(url: string): Promise<boolean> {
  try {
    await validateURL({
      url,
      ipPrefixes: RESTRICTED_IPS,
    });
  } catch (err: any) {
    if (!VALIDATE_URL_IGNORED_ERRORS.some((msg) => err.message.includes(msg))) {
      report(new Error('Blocked url'), { err, url });
    }
    return false;
  }

  return true;
}
