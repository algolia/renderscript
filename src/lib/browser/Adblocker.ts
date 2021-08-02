import { request } from 'undici';

const list = 'https://badmojr.github.io/1Hosts/Lite/domains.txt';

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
    console.log('Adblocker ready,', this.#hostnames.size, 'entries');
  }

  match(url: URL): boolean {
    return this.#hostnames.has(url.hostname);
  }
}
