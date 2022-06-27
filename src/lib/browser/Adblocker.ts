import { request } from 'undici';

import { log as mainLog } from 'helpers/logger';

// TO DO: copy this at compile time.
const list =
  'https://raw.githubusercontent.com/badmojr/1Hosts/master/Pro/domains.txt';

const log = mainLog.child({ svc: 'adbk' });

/**
 * Dead simple adblocking by exact hostname.
 */
export class Adblocker {
  #hostnames: Set<string> = new Set();

  async load(): Promise<void> {
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
  }

  match(url: URL): boolean {
    return this.#hostnames.has(url.hostname);
  }
}
