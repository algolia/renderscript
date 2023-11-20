import { Api } from './api/index';
import { report } from './helpers/errorReporting';
import { gracefulClose } from './helpers/gracefulClose';
import { log } from './helpers/logger';
import * as singletons from './lib/singletons';

const PORT = parseInt(process.env.PORT || '3000', 10);

// Uncaught Promise Rejection
process.on('unhandledRejection', (reason) => {
  report(new Error('unhandled rejection'), { err: reason });

  log.info('Hard exit after unhandledRejection');
  // We are not sure if it's stable or not
  setTimeout(() => {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }, 1);
});

process.on('uncaughtException', (reason) => {
  report(new Error('uncaught exception'), { err: reason });

  log.info('Hard exit after uncaughtException');
  // We are not sure if it's stable or not
  setTimeout(() => {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }, 1);
});

(async (): Promise<void> => {
  log.info('Starting...', {
    env: process.env.NODE_ENV,
    v: process.env.VERSION,
  });

  const api = new Api();
  api.start(PORT);

  await singletons.init();

  // Handle SIGINT
  // It doesn't seem to handle it correctly, but it's just `yarn` messing up
  // Try running
  //
  //     yarn build && NODE_ENV=development node dist/index.js
  //
  // to see that it works fine
  const gracefulCloseParams = { api, tasksManager: singletons.tasksManager };
  const boundGracefulClose = gracefulClose.bind(null, gracefulCloseParams);
  process.on('SIGINT', boundGracefulClose);
  process.on('SIGTERM', boundGracefulClose);
})();
