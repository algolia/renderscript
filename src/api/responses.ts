import type { Metrics } from 'lib/types';

export interface PostRender {
  statusCode: number | null;
  metrics: Metrics;
  headers: Record<string, string>;
  body: string | null;
  timeout: boolean;
}

export interface Res500 {
  error: string;
}
