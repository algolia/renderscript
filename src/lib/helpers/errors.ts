import type { HandledError, UnhandledError } from '../types';

export const retryableErrors: Array<HandledError | UnhandledError> = [
  'body_serialisation_failed',
  'connection_error',
  'fetch_aborted',
  'fetch_timeout',
  'no_cookies',
  'no_response_after_login',
  'page_closed_too_soon',
  'page_crashed',
  'timedout',
  'unknown_error',
  'error_reading_response',
];

/* eslint-disable complexity */
export function cleanErrorMessage(error: Error): HandledError | UnhandledError {
  if (
    error.message.includes('ERR_NAME_NOT_RESOLVED') ||
    error.message.includes('ERR_ADDRESS_UNREACHABLE')
  ) {
    return 'dns_error';
  }
  if (
    error.message.includes('ERR_CONNECTION_REFUSED') ||
    error.message.includes('ERR_CONNECTION_ABORTED') ||
    error.message.includes('ERR_CONNECTION_CLOSED') ||
    error.message.includes('ERR_CONNECTION_FAILED') ||
    error.message.includes('ERR_INTERNET_DISCONNECTED') ||
    error.message.includes('ERR_CONNECTION_RESET')
  ) {
    return 'connection_error';
  }
  if (error.message.includes('ERR_ABORTED')) {
    return 'fetch_aborted';
  }
  if (
    error.message.includes('ETIMEDOUT') ||
    error.message.includes('ESOCKETTIMEDOUT')
  ) {
    return 'fetch_timeout';
  }
  if (
    error.message.includes('Navigation failed because page was closed') ||
    error.message.includes('Target closed') ||
    error.message.includes('Target page, context or browser has been closed') ||
    error.message.includes('Target has been closed') ||
    error.message.includes('Browser has been disconnected')
  ) {
    return 'page_closed_too_soon';
  }
  if (
    error.message.includes('goto_no_response') ||
    error.message.includes('Navigation failed because page crashed') ||
    error.message.includes('ERR_FAILED') ||
    error.message.includes('Element is not attached to the DOM')
  ) {
    return 'page_crashed';
  }
  if (error.message.includes('ERR_BLOCKED_BY_RESPONSE')) {
    return 'forbidden_by_website';
  }
  if (error.message.includes('ERR_TIMED_OUT')) {
    // This is a generic error from playwright
    return 'timedout';
  }

  return `unknown_error`;
}

export class ErrorIsHandledError extends Error {}
