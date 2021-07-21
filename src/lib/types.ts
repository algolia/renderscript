import type {
  Page,
  BrowserContext,
  Protocol,
} from 'puppeteer-core/lib/esm/puppeteer/api-docs-entry';

import type { Task } from './tasks/Task';

export interface TaskBaseParams {
  type: 'render' | 'login';
  url: URL;
  userAgent: string;
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
  forcedWait: number | null;
  serialize: number | null;
  total: number | null;
}

export interface NewPage {
  page: Page;
  context: BrowserContext;
}

export interface TaskObject {
  id: string;
  task: Task;
}
