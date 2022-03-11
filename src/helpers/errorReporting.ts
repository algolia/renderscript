import * as Sentry from '@sentry/node';

import { log } from './logger';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: process.env.npm_package_version,
  environment: process.env.CLUSTER_NAME || process.env.NODE_ENV,
  serverName: 'renderscript',
  ignoreErrors: [],
  maxBreadcrumbs: 10,
});

export function report(err: Error, extra: any = {}): void {
  if (!process.env.SENTRY_DSN) {
    log.error(err.message, err.stack, extra);
    return;
  }

  log.error(err.message);
  Sentry.withScope((scope) => {
    scope.setExtras(extra);
    Sentry.captureException(err);
  });
}

export async function drain(): Promise<boolean> {
  const client = Sentry.getCurrentHub().getClient();
  if (client) {
    return await client.close(2000);
  }

  return true;
}
