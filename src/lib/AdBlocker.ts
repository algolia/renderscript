// Do not work for the moment
// Please see https://github.com/brave/adblock-rust

import { promises as fs } from 'fs';
// @ts-ignore
import { AdBlockClient, FilterOptions } from 'adblock-rs';

import getAdblockListPath, {
  ADBLOCK_LISTS,
} from 'lib/helpers/getAdBlockListPath';

const CHUNK_SIZE = 1000;

export default class AdBlocker {
  private _client: AdBlockClient;
  private _initPromise: Promise<void> | null;

  constructor() {
    this._client = new AdBlockClient();
    this._initPromise = this._init();
  }

  async waitForReadyness() {
    if (this._initPromise) await this._initPromise;
  }

  async test(url: string, requestType: string, host: string) {
    if (this._initPromise) await this._initPromise;
    if (ADBLOCK_LISTS.length === 0) return false;
    return this._client.matches(url, FilterOptions[requestType], host);
  }

  private async _init() {
    const filterLists = await Promise.all(
      ADBLOCK_LISTS.map(
        async (name) =>
          await fs.readFile(await getAdblockListPath(name), {
            encoding: 'utf-8',
          })
      )
    );
    if (filterLists.length > 0) {
      console.info('Parsing blocker lists...');
      for (const listAsStr of filterLists) {
        // Split into chunks to not block the main thread too much
        const listAsArr = listAsStr.split('\n');
        for (let i = 0; i < listAsArr.length; i += CHUNK_SIZE) {
          const chunk = listAsArr.slice(i, i + CHUNK_SIZE);
          this._client.parse(chunk.join('\n'));
          // Give back to main thread
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
      console.info('Parsed blocker lists');
    }
    this._initPromise = null;
  }
}
