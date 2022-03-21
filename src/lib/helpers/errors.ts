export function cleanErrorMessage(error: Error): string {
  if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
    return 'dns_error';
  }
  if (error.message.includes('ERR_CONNECTION_REFUSED')) {
    return 'dns_error';
  }
  if (error.message.includes('ERR_ABORTED')) {
    return 'fetch_abort';
  }
  if (error.message.includes('ETIMEDOUT' || 'ESOCKETTIMEDOUT')) {
    return 'fetch_timeout';
  }

  return `unknown_error`;
}
