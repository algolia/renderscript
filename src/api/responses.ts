import type { Metrics } from 'lib/types';

export type PostRender = PostRenderSuccess | Res500;

export interface PostRenderSuccess {
  statusCode: number | null;
  metrics: Metrics;
  headers: Record<string, string>;
  body: string | null;
  timeout: boolean;
}

export interface Res500 {
  error: string;
}
