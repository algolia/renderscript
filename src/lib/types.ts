import type {
  Page,
  BrowserContext,
  Protocol,
} from 'puppeteer-core/lib/esm/puppeteer/api-docs-entry';

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

export interface TaskResult {
  statusCode?: number;
  body?: string;
  headers?: Record<string, string>;
  timeout?: boolean;
  error?: string;
  resolvedUrl?: string;
  cookies?: Protocol.Network.Cookie[];
}

export interface NewPage {
  page: Page;
  context: BrowserContext;
}

export interface TaskObject {
  id: string;
  promise: Promise<TaskResult>;
}
