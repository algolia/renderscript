import type {
  Browser as BrowserInterface,
  BrowserContext,
  BrowserContextOptions,
} from 'playwright';
import { chromium } from 'playwright';
import { v4 as uuid } from 'uuid';

import { log as mainLog } from 'helpers/logger';
import { stats } from 'helpers/stats';

import { flags, HEIGHT, WIDTH } from '../constants';

const log = mainLog.child({ svc: 'bwr' });

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
    log.info('Creating...', { id: this.#id });

    const env: { [s: string]: string } = {};
    if (process.env.DISPLAY) {
      env.DISPLAY = process.env.DISPLAY;
    }

    let start = Date.now();
    const browser = await chromium.launch({
      headless: true,
      env,
      handleSIGINT: false,
      handleSIGHUP: false,
      handleSIGTERM: false,
      args: flags,
    });
    this.#browser = browser;
    stats.timing('renderscript.create', Date.now() - start);

    // Try to load a test page first
    start = Date.now();
    const context = await this.getNewContext({});
    const testPage = await context.newPage();
    await testPage.goto('about://settings', {
      waitUntil: 'networkidle',
      timeout: 2000,
    });
    stats.timing('renderscript.page.initial', Date.now() - start);
    await testPage.close();
    await context.close();

    this.#ready = true;
    log.info('Ready', { id: this.#id });
  }

  async stop(): Promise<void> {
    await this.#browser?.close();
  }

  getCurrentConcurrency(): number {
    if (!this.#browser) {
      return 0;
    }

    return this.#browser.contexts().reduce((i, ctx) => {
      return i + ctx.pages().length;
    }, 0);
  }

  async getNewContext(opts: BrowserContextOptions): Promise<BrowserContext> {
    const start = Date.now();
    const ctx = await this.#browser!.newContext({
      acceptDownloads: false,
      bypassCSP: false,
      hasTouch: false,
      isMobile: false,
      javaScriptEnabled: true,
      locale: 'en-GB',
      timezoneId: 'Europe/Paris',
      offline: false,
      permissions: [],
      userAgent: 'Algolia Crawler Renderscript',
      viewport: { height: HEIGHT, width: WIDTH },
      extraHTTPHeaders: {
        'Accept-Encoding': 'gzip, deflate',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      },
      ...opts,
    });
    stats.timing('renderscript.context.create', Date.now() - start);

    return ctx;
  }
}
