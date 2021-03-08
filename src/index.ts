import Api from 'api/index';
import dotenv from 'helpers/dotenv';
import gracefulClose from 'helpers/gracefulClose';
import renderer from 'lib/rendererSingleton';

dotenv();

console.info(`NODE_ENV = ${process.env.NODE_ENV}`);

const PORT = parseInt(process.env.PORT || '3000', 10);

const api = new Api();

// Uncaught Promise Rejection
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection');
  console.error(reason);

  // process.exit(1);
});

// Handle SIGINT
// It doesn't seem to handle it correctly, but it's just `yarn` messing up
// Try running
//
//     yarn build && NODE_ENV=development node dist/index.js
//
// to see that it works fine
const gracefulCloseParams = { api, renderer };
const boundGracefulClose = gracefulClose.bind(null, gracefulCloseParams);
process.on('SIGINT', boundGracefulClose);
process.on('SIGTERM', boundGracefulClose);

api.start(PORT);
