import type { Cookie } from 'playwright-chromium';

import type { Metrics, TaskBaseParams } from 'lib/types';

import type { Res500 } from './responses';

export type PostLoginParams = Omit<
  TaskBaseParams,
  'type' | 'url' | 'userAgent'
> & {
  url: string;
  ua: string;
  username: string;
  password: string;
  renderHTML: boolean;
};

export type PostLoginResponse = PostLoginSuccess | Res500;

export interface PostLoginSuccess {
  /**
   * HTTP Code of the rendered page.
   */
  statusCode: number | null;

  /**
   * HTTP Headers of the rendered page.
   */
  headers: Record<string, string>;

  /**
   * Metrics from different taks during the rendering.
   */
  metrics: Metrics;

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

  /**
   * Cookie generated from a succesful login.
   */
  cookies: Cookie[];

  /**
   * The URL at the end of a succesful login.
   */
  resolvedUrl: string | null;

  /**
   * Body at the end of a succesful login.
   */
  body: string | null;
}
