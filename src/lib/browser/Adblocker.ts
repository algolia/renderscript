import { promises as fs } from 'fs';
import path from 'path';

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
      const data = await fs.readFile(
        path.join(process.cwd(), 'dist/lib/browser/adblock_hosts.txt'),
        'utf8'
      );
      const lines = data.split(/[\r\n]+/);

      for (const line of lines) {
        // Skip comments (! or #) and empty lines
        if (!line || line.startsWith('!') || line.startsWith('#')) {
          continue;
        }
        // Parse adblock filter syntax: ||domain.com^
        if (line.startsWith('||') && line.endsWith('^')) {
          this.#hostnames.add(line.slice(2, -1));
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
