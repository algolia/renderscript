import puppeteer from 'puppeteer-core';
import type { Browser as BrowserInterface } from 'puppeteer-core/lib/esm/puppeteer/api-docs-entry';
import { v4 as uuid } from 'uuid';

import { stats } from 'helpers/stats';
import { getChromiumExecutablePath } from 'lib/helpers/getChromiumExecutablePath';

import { flags, HEIGHT, WIDTH } from '../constants';

export class Browser {
  #id;
  #ready: boolean = false;
  #browser: BrowserInterface | undefined;

  constructor() {
    this.#id = uuid();
  }

  get isReady(): boolean {
    return this.#ready;
  }

  get instance(): BrowserInterface | undefined {
    return this.#browser;
  }

  /**
   * Create a puppeteer instance.
   */
  async create(): Promise<void> {
    console.info(`Browser ${this.#id} creating...`);

    const env: { [s: string]: string } = {};
    if (process.env.DISPLAY) {
      env.DISPLAY = process.env.DISPLAY;
    }

    let start = Date.now();
    const browser = await puppeteer.launch({
      headless: true,
      env,
      executablePath: await getChromiumExecutablePath(),
      defaultViewport: {
        width: WIDTH,
        height: HEIGHT,
      },
      handleSIGINT: false,
      handleSIGTERM: false,
      pipe: true,
      args: flags,
    });
    stats.timing('renderscript.create', Date.now() - start);

    // Try to load a test page first
    start = Date.now();
    const testPage = await browser.newPage();
    await testPage.goto('about://settings', { waitUntil: 'networkidle0' });
    stats.timing('renderscript.page.initial', Date.now() - start);

    this.#browser = browser;
    this.#ready = true;
  }

  async stop(): Promise<void> {
    await this.#browser?.close();
  }
}
