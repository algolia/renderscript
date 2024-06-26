import { request } from 'undici';

import { report } from '../../helpers/errorReporting';
import { log as mainLog } from '../../helpers/logger';

// TO DO: Cronjob to update this list on our servers
const list =
  'https://raw.githubusercontent.com/badmojr/1Hosts/master/Pro/domains.txt';

const log = mainLog.child({ svc: 'adbk' });

/**
 * Dead simple adblocking by exact hostname.
 */
export class Adblocker {
  #hostnames: Set<string> = new Set();

  async load(): Promise<void> {
    try {
      const res = await request(list, {
        method: 'GET',
      });

      let body = '';
      for await (const chunk of res.body) {
        body += chunk.toString();
      }
      const lines = body.split(/[\r\n]+/);

      for (const line of lines) {
        if (!line.startsWith('#')) {
          this.#hostnames.add(line);
        }
      }

      log.info('Ready', {
        entries: this.#hostnames.size,
        lastMod: res.headers['last-modified'],
      });
    } catch (err: any) {
      report(new Error('Error while setting up adblocker'), { err });
    }
  }

  match(url: URL): boolean {
    return this.#hostnames.has(url.hostname);
  }
}
