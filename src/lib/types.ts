import type { Cookie } from 'playwright';

export type TaskFromAPI = Omit<TaskBaseParams, 'type' | 'url' | 'userAgent'> & {
  url: string;
  ua: string;
};

export interface TaskBaseParams {
  type: 'login' | 'render';
  url: URL;
  userAgent: string;
  adblock?: boolean;
  waitTime?: {
    min?: number;
    max?: number;
  };
  headersToForward: {
    [s: string]: string;
  };
}

export interface RenderTaskParams extends TaskBaseParams {
  type: 'render';
}

export interface LoginTaskParams extends TaskBaseParams {
  type: 'login';
  login: {
    username: string;
    password: string;
  };
  renderHTML?: boolean;
}

export type TaskParams = LoginTaskParams | RenderTaskParams;

export interface TaskFinal extends TaskResult {
  metrics: Metrics;
}

export interface TaskResult {
  startAt: number;
  statusCode?: number;
  body?: string;
  headers?: Record<string, string>;
  timeout?: boolean;
  error?: string;
  resolvedUrl?: string;
  cookies?: Cookie[];
}

export interface Metrics {
  goto: number | null;
  minWait: number | null;
  serialize: number | null;
  total: number | null;
  page: PageMetrics | null;
}

export interface PageMetrics {
  downloadDuration: number | null;
  mem: {
    jsHeapUsedSize: number | null;
    jsHeapTotalSize: number | null;
  };
  requests: number;
  blockedRequests: number;
  contentLength: number;
  contentLengthTotal: number;
}

export interface TaskObject {
  id: string;
  taskPromise?: Promise<void>;
  createdAt: Date;
}
