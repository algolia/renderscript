import * as Sentry from '@sentry/node';

import { version } from '../../package.json';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: version,
  environment: process.env.NODE_ENV,
  serverName: 'renderscript',
  ignoreErrors: [],
});

export function report(err: Error, extra: any = {}): void {
  if (!process.env.SENTRY_DSN) {
    console.error(err);
    return;
  }

  console.error(err.message);
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