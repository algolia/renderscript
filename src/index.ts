import { Api } from 'api/index';
import { report } from 'helpers/errorReporting';
import { gracefulClose } from 'helpers/gracefulClose';
import { tasksManager } from 'lib/singletons';

console.info(`NODE_ENV = ${process.env.NODE_ENV}`);

const PORT = parseInt(process.env.PORT || '3000', 10);

// Uncaught Promise Rejection
process.on('unhandledRejection', (reason) => {
  report(new Error('unhandled rejection'), { err: reason });

  console.log('Exit');
  // We are not sure if it's stable or not
  setTimeout(() => {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }, 1);
});
process.on('uncaughtException', (reason) => {
  report(new Error('uncaught exception'), { err: reason });
});

const api = new Api();

// Handle SIGINT
// It doesn't seem to handle it correctly, but it's just `yarn` messing up
// Try running
//
//     yarn build && NODE_ENV=development node dist/index.js
//
// to see that it works fine
const gracefulCloseParams = { api, tasksManager };
const boundGracefulClose = gracefulClose.bind(null, gracefulCloseParams);
process.on('SIGINT', boundGracefulClose);
process.on('SIGTERM', boundGracefulClose);

api.start(PORT);
