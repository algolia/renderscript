import type {
  Page,
  BrowserContext,
  Protocol,
} from 'puppeteer-core/lib/esm/puppeteer/api-docs-entry';

export type TaskFromAPI = Omit<TaskBaseParams, 'type' | 'url' | 'userAgent'> & {
  url: string;
  ua: string;
};

export interface TaskBaseParams {
  type: 'render' | 'login';
  url: URL;
  userAgent: string;
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
}

export type TaskParams = RenderTaskParams | LoginTaskParams;

export interface TaskFinal extends TaskResult {
  metrics: Metrics;
}

export interface TaskResult {
  statusCode?: number;
  body?: string;
  headers?: Record<string, string>;
  timeout?: boolean;
  error?: string;
  resolvedUrl?: string;
  cookies?: Protocol.Network.Cookie[];
}

export interface Metrics {
  goto: number | null;
  minWait: number | null;
  serialize: number | null;
  total: number | null;
  page: PageMetrics | null;
}

export interface PageMetrics {
  layoutDuration: number | null;
  scriptDuration: number | null;
  taskDuration: number | null;
  jsHeapUsedSize: number | null; // currently active to render the page
  jsHeapTotalSize: number | null; // total allocated
  requests: number;
  blockedRequests: number;
  contentLength: number;
  contentLengthTotal: number;
}

export interface NewPage {
  page: Page;
  context: BrowserContext;
}

export interface TaskObject {
  id: string;
  taskPromise: Promise<void>;
}
