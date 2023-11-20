import type express from 'express';

import { HEADERS_TO_FORWARD } from '../constants';

export function getForwardedHeadersFromRequest(
  req: express.Request<any, any, any, any>
): Record<string, string> {
  const headersToForward = HEADERS_TO_FORWARD.reduce((partial, headerName) => {
    const name = headerName.toLowerCase();
    if (req.headers[name]) {
      return { ...partial, [name]: req.headers[name] };
    }
    return partial;
  }, {});

  return headersToForward;
}
