import type { Cookie } from 'playwright';

import type { BrowserEngine } from 'lib/browser/Browser';

import type { Task } from './tasks/Task';

export type HandledError =
  | HandledLoginError
  | 'body_serialisation_failed'
  | 'connection_error'
  | 'dns_error'
  | 'error_reading_response'
  | 'fetch_aborted'
  | 'fetch_timeout'
  | 'forbidden_by_website'
  | 'no_cookies'
  | 'page_closed_too_soon'
  | 'page_crashed'
  | 'redirection'
  | 'timedout'
  | 'wrong_redirection';

export type HandledLoginError =
  | 'field_not_found'
  | 'no_response_after_login'
  | 'too_many_fields';

export type UnhandledError = 'unknown_error';

export interface TaskBaseParams {
  url: URL;
  userAgent: string;
  adblock?: boolean;
  browser?: BrowserEngine;
  waitTime?: {
    min?: number;
    max?: number;
  };
  headersToForward?: {
    [s: string]: string;
  };
}

export interface Perf {
  curr: PerformanceNavigationTiming;
  all: PerformanceEntryList;
  mem: {
    jsHeapSizeLimit?: number;
    totalJSHeapSize?: number;
    usedJSHeapSize?: number;
  };
}

export type RenderTaskParams = TaskBaseParams;

export interface LoginTaskParams extends TaskBaseParams {
  login: {
    username: string;
    password: string;
  };
  renderHTML?: boolean;
}

export type TaskParams = LoginTaskParams | RenderTaskParams;

export interface TaskFinal extends TaskResult {
  metrics: Metrics;
  timeout: boolean;
}

export interface TaskResult {
  statusCode: number | null;
  body: string | null;
  error: HandledError | UnhandledError | null;
  rawError: Error | null;
  headers: Record<string, string>;
  resolvedUrl: string | null;
  cookies: Cookie[];
}

export type ErrorReturn = Optional<
  Pick<TaskResult, 'error' | 'rawError'>,
  'rawError'
>;

export interface Metrics {
  timings: {
    context: number | null;
    goto: number | null;
    equiv: number | null;
    ready: number | null;
    minWait: number | null;
    serialize: number | null;
    close: number | null;
    total: number | null;
  };
  renderingBudget: {
    max: number;
    consumed: number;
  };
  page: PageMetrics | null;
}

export interface PageMetrics {
  timings: {
    download: number | null;
  };
  mem: {
    jsHeapUsedSize: number | null;
    jsHeapTotalSize: number | null;
  };
  requests: {
    total: number;
    blocked: number;
    pending: number;
  };
  contentLength: {
    main: number;
    total: number;
  };
}

export interface TaskObject {
  ref: Task;
  promise: Promise<TaskFinal>;
}

/**
 * Take an interface and list the keys that are optional.
 *
 * @example
 * interface Hello {
 *   foo?: string;
 *   bar?: string;
 *   baz: string;
 * }
 *
 * OptionalKeys<Hello>;
 *
 * Will result in:
 * 'foo' | 'bar'
 */
export type OptionalKeys<T> = {
  [K in keyof T]: undefined extends T[K] ? K : never;
}[keyof T];

/**
 * Take an interface and choose what property should undefined.
 *
 * @example
 * interface Hello {
 *  foo: string;
 *  bar: string;
 *  baz?: string;
 * };
 *
 * Optional<Hello, 'bar'>;
 *
 * Will results in:
 * {
 *  foo: string;
 *  bar?: string;
 *  baz?: string;
 * }
 *
 */
export type Optional<T, K extends keyof T> = {
  [P in Exclude<keyof T, Exclude<keyof T, K | OptionalKeys<T>>>]?: T[P];
} & {
  [P in Exclude<keyof T, K | OptionalKeys<T>>]: T[P];
};
