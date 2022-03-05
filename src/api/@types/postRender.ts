import type { Metrics, TaskBaseParams } from 'lib/types';

import type { Res500 } from './responses';

export type PostRenderParams = Omit<
  TaskBaseParams,
  'type' | 'url' | 'userAgent'
> & {
  url: string;
  ua: string;
};

export type PostRenderResponse = PostRenderSuccess | Res500;

export interface PostRenderSuccess {
  /**
   * HTTP Code of the rendered page.
   */
  statusCode: number | null;

  /**
   * HTTP Headers of the rendered page.
   */
  headers: Record<string, string>;

  /**
   * Body of the rendered page.
   */
  body: string | null;

  /**
   * Metrics from different taks during the rendering.
   */
  metrics: Metrics;

  /**
   * The redirection renderscript caught.
   */
  resolvedUrl: string | null;

  /**
   * Has the page reached timeout?
   * When timeout has been reached we continue the rendering as usual
   * but reduce other timeout to a minimum.
   */
  timeout: boolean;

  /**
   * Any error encountered along the way.
   * If this field is filled that means the rest of the payload is partial.
   */
  error: string | null;
}
