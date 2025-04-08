import { validateURL } from '@algolia/dns-filter';

import { report } from '../../helpers/errorReporting';
import { VALIDATE_URL_IGNORED_ERRORS } from '../browser/constants';
import { RESTRICTED_IPS } from '../constants';

export async function isURLAllowed(url: string): Promise<boolean> {
  try {
    // Check for valid URL before validation
    // eslint-disable-next-line no-new
    new URL(url);
  } catch (e) {
    report(new Error('Invalid url'), { url, err: e });
    return false;
  }
  try {
    await validateURL({
      url,
      ipPrefixes: RESTRICTED_IPS,
    });
  } catch (err: any) {
    if (!VALIDATE_URL_IGNORED_ERRORS.some((msg) => err.message.includes(msg))) {
      report(new Error('Blocked url'), { err, url });
      return false;
    }
    return true;
  }

  return true;
}
