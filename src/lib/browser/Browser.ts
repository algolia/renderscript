import type {
  Browser as BrowserInterface,
  BrowserContext,
  BrowserContextOptions,
} from 'playwright';
import { chromium, firefox } from 'playwright';
import { v4 as uuid } from 'uuid';

import { report } from '../../helpers/errorReporting';
import { log as mainLog } from '../../helpers/logger';
import { stats } from '../../helpers/stats';

import { flags, HEIGHT, WIDTH } from './constants';

const log = mainLog.child({ svc: 'brws' });

export type BrowserEngine = 'chromium' | 'firefox';
export const DEFAULT_ENGINE: BrowserEngine = 'chromium';

export class Browser {
  #id;
  #engine: BrowserEngine;
  #ready: boolean = false;
  #stopping: boolean = false;
  #browser: BrowserInterface | undefined;

  constructor(engine?: BrowserEngine) {
    this.#id = uuid();
    this.#engine = engine || 'chromium';
  }

  get isReady(): boolean {
    return (
      this.#ready &&
      typeof this.#browser !== 'undefined' &&
      this.#browser.isConnected()
    );
  }

  get instance(): BrowserInterface | undefined {
    return this.#browser;
  }

  /**
   * Create a Playwright instance.
   */
  async create(): Promise<void> {
    log.info(`Creating ${this.#engine}...`, { id: this.#id });

    const env: { [s: string]: string } = {};
    if (process.env.DISPLAY) {
      env.DISPLAY = process.env.DISPLAY;
    }

    const start = Date.now();
    try {
      const browser = this.#engine === 'firefox' ? firefox : chromium;
      let executablePath = undefined;

      if (process.env.USE_LATEST_CHROME) {
        executablePath =
          this.#engine === 'chromium' ? '/usr/bin/google-chrome' : undefined;
      }

      this.#browser = await browser.launch({
        headless: true,
        env,
        handleSIGINT: false,
        handleSIGHUP: false,
        handleSIGTERM: false,
        args: flags,
        executablePath,
      });
      this.#browser.on('disconnected', () => {
        if (!this.#stopping) {
          this.#ready = false;
          report(
            new Error(
              `Browser disconnected (engine: ${this.#engine}). Relaunching...`
            )
          );
          this.create();
        }
      });
    } catch (e: any) {
      report(e, { browser: this.#engine });
    }
    stats.timing('renderscript.create', Date.now() - start, {
      browser: this.#engine,
    });

    this.#ready = true;
    log.info('Ready', {
      id: this.#id,
      browser: this.#engine,
      version: this.#browser?.version(),
    });
  }

  async stop(): Promise<void> {
    this.#stopping = true;
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
    if (!this.#browser?.isConnected()) {
      throw new Error(`No browser available (engine=${this.#engine})`);
    }

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
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      },
      ...opts,
    });
    stats.timing('renderscript.context.create', Date.now() - start);

    return ctx;
  }
}
