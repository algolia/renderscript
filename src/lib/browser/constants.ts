export const RESPONSE_IGNORED_ERRORS = [
  // 200 no body, HEAD, OPTIONS
  'No data found for resource with given identifier',
  'No resource with given identifier found',
  // Too big to fit in memory, or memory filled
  'Request content was evicted from inspector cache',
  // Protocol error, js redirect or options
  'This might happen if the request is a preflight request',
  // Can happen if the page that trigger this response was closed in the meantime
  'Target closed',
  'Target page, context or browser has been closed',
];

export const REQUEST_IGNORED_ERRORS = ['Request is already handled'];

export const GOTO_IGNORED_ERRORS = ['Navigation timeout'];

export const VALIDATE_URL_IGNORED_ERRORS = ['ENOTFOUND', 'EAI_AGAIN'];

export const METRICS_IGNORED_ERRORS = [
  // Navigation or page closed, okay for metrics
  'Target closed',
  'Execution context was destroyed',
  'Renderscript Controlled Timeout',
];

export const WIDTH = 1280;
export const HEIGHT = 1024;

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
