import { PRIVATE_IP_PREFIXES } from '@algolia/dns-filter';

export const flags = [
  // Disable sandboxing when not available
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--no-zygote',
  // No GPU available inside Docker
  '--disable-gpu',
  // Seems like a powerful hack, not sure why
  // https://github.com/Codeception/CodeceptJS/issues/561
  "--proxy-server='direct://'",
  '--proxy-bypass-list=*',
  // Disable cache
  '--disk-cache-dir=/dev/null',
  '--media-cache-size=1',
  '--disk-cache-size=1',
  // Disable useless UI features
  '--disable-extensions',
  '--disable-features=Translate',
  '--disable-infobars',
  '--disable-notifications',
  '--disable-translate',
  '--no-default-browser-check',
  '--no-first-run', // screen on very first run
  '--noerrdialogs',
  '--disable-background-timer-throttling',
  '--disable-password-generation',
  '--disable-prompt-on-repos',
  '--disable-save-password-bubble',
  '--disable-single-click-autofill',
  '--disable-restore-session-state',
  '--disable-translate',
  '--disable-new-profile-management',
  '--disable-new-avatar-menu',
  '--disable-infobars',
  '--disable-device-discovery-notifications',
  '--disable-client-side-phishing-detection',
  '--disable-notifications',
  '--disable-component-extensions-with-background-pages',
  // Disable dev-shm
  // See https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#tips
  '--disable-dev-shm-usage',

  // Taken from https://github.com/cypress-io/cypress/blob/develop/packages/server/lib/browsers/chrome.ts
  // "--disable-background-networking"
  '--disable-web-resources',
  '--safebrowsing-disable-auto-update',
  '--safebrowsing-disable-download-protection',
  '--disable-client-side-phishing-detection',
  '--disable-component-update',
  '--disable-default-apps',

  // Crash reporter
  '--disable-breakpad',
  '--disable-crash-reporter',
];

export const IP_PREFIXES_WHITELIST = process.env.IP_PREFIXES_WHITELIST
  ? process.env.IP_PREFIXES_WHITELIST.split(',')
  : ['127.', '0.', '::1'];

export const RESTRICTED_IPS =
  process.env.ALLOW_LOCALHOST === 'true'
    ? PRIVATE_IP_PREFIXES.filter(
        (prefix: string) => !IP_PREFIXES_WHITELIST.includes(prefix)
      ) // relax filtering
    : PRIVATE_IP_PREFIXES;

export const WIDTH = 1280;
export const HEIGHT = 1024;
export const IGNORED_RESOURCES = [
  'font',
  'image',
  'media',
  'websocket',
  'manifest',
  'texttrack',
];
export const PAGE_BUFFER_SIZE = 2;
export const DATA_REGEXP = /^data:/i;

export const MAX_RENDERER_TASKS = 256;

export const WAIT_TIME = {
  min: 0,
  max: 20000,
};

export const UNHEALTHY_TASK_TTL = 1 * 60 * 1000;
