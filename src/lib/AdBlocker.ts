import { promises as fs } from "fs";
import { AdBlockClient, FilterOptions } from "ad-block";

import getAdblockListPath, {
  ADBLOCK_LISTS
} from "lib/helpers/getAdBlockListPath";

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
      ADBLOCK_LISTS.map(async name => {
        return await fs.readFile(await getAdblockListPath(name), {
          encoding: "utf-8"
        });
      })
    );
    if (filterLists.length > 0) {
      console.info("Parsing blocker lists...");
      filterLists.map(list => this._client.parse(list));
      console.info("Parsed blocker lists");
    }
    this._initPromise = null;
  }
}
