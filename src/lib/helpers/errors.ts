export type HandledError =
  | 'dns_error'
  | 'fetch_abort'
  | 'fetch_timeout'
  | 'page_closed_too_soon';
export type UnhandledError = 'unknown_error';

export function cleanErrorMessage(error: Error): HandledError | UnhandledError {
  if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
    return 'dns_error';
  }
  if (error.message.includes('ERR_CONNECTION_REFUSED')) {
    return 'dns_error';
  }
  if (error.message.includes('ERR_ABORTED')) {
    return 'fetch_abort';
  }
  if (
    error.message.includes('ETIMEDOUT') ||
    error.message.includes('ESOCKETTIMEDOUT')
  ) {
    return 'fetch_timeout';
  }
  if (
    error.message.includes('Navigation failed because page was closed') ||
    error.message.includes('Target closed')
  ) {
    return 'page_closed_too_soon';
  }

  return `unknown_error`;
}
