export const HEADERS_TO_FORWARD = process.env.HEADERS_TO_FORWARD
  ? process.env.HEADERS_TO_FORWARD.split(',')
  : ['Cookie', 'Authorization'];

// Only whitelist loading styles resources when testing
// (will not change programmatic use of this system)
export const CSP_HEADERS = [
  "default-src 'none'",
  "style-src * 'unsafe-inline'",
  'img-src * data:',
  'font-src *',
].join('; ');

export const SESSION_COOKIE = 'sessionToken=53cu23_535510n';

export const DELETE_COOKIE =
  'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
