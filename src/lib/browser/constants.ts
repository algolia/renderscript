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
];
