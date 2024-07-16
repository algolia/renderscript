import { promises as fs } from 'fs';

import { report } from '../../helpers/errorReporting';
import { log as mainLog } from '../../helpers/logger';

const log = mainLog.child({ svc: 'adbk' });

/**
 * Dead simple adblocking by exact hostname.
 */
export class Adblocker {
  #hostnames: Set<string> = new Set();

  async load(): Promise<void> {
    try {
      const data = await fs.readFile(`${__dirname}/adblock_hosts.txt`, 'utf8');
      const lines = data.split(/[\r\n]+/);

      for (const line of lines) {
        if (!line.startsWith('#')) {
          this.#hostnames.add(line);
        }
      }

      log.info('Ready', {
        entries: this.#hostnames.size,
      });
    } catch (err: any) {
      report(new Error('Error while setting up adblocker'), { err });
    }
  }

  match(url: URL): boolean {
    return this.#hostnames.has(url.hostname);
  }
}
