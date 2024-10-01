import * as Sentry from '@sentry/node';

import { log } from './logger';

export const RENDERSCRIPT_TASK_URL_TAG = 'renderscript:task:url';
export const RENDERSCRIPT_TASK_TYPE_TAG = 'renderscript:task:type';

type SentryTag = {
  key: string;
  value: string;
};

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: process.env.npm_package_version,
  environment: process.env.CLUSTER_NAME || process.env.NODE_ENV,
  serverName: 'renderscript',
  ignoreErrors: [],
  maxBreadcrumbs: 10,
});

export function report(
  err: Error,
  extra: any = {},
  tags: SentryTag[] = []
): void {
  if (!process.env.SENTRY_DSN) {
    console.error({ err, extra });
    return;
  }

  log.error(err.message, extra);
  Sentry.withScope((scope) => {
    tags.forEach((tag) => {
      Sentry.setTag(tag.key, tag.value);
    });

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
