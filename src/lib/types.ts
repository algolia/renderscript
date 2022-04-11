import type { Cookie } from 'playwright-chromium';

import type { Task } from './tasks/Task';

export type HandledError =
  | 'body_serialisation_failed'
  | 'connection_error'
  | 'dns_error'
  | 'fetch_aborted'
  | 'fetch_timeout'
  | 'field_not_found'
  | 'forbidden_by_website'
  | 'no_cookies'
  | 'no_response_after_login'
  | 'page_closed_too_soon'
  | 'page_crashed'
  | 'redirection'
  | 'timedout'
  | 'wrong_redirection';

export type UnhandledError = 'unknown_error';

export interface TaskBaseParams {
  url: URL;
  userAgent: string;
  adblock?: boolean;
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
