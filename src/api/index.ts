import http = require("http");
import * as express from "express";
import bodyParser = require("body-parser");

import gracefulClose from "api/helpers/gracefulClose";
import requestLogger from "api/helpers/requestLogger";

import { render, validateRender } from "api/routes/render";

import renderer from "lib/rendererSingleton";

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);

/* App setup */

app.disable("x-powered-by");
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(requestLogger);

/* Routes setup */

app
  .route("/render")
  .get(validateRender, render)
  .post(validateRender, render);

/* Error handling */

// Uncaught Promise Rejection
process.on("unhandledRejection", reason => {
  console.error(reason);
  process.exit(1);
});

// Handle SIGINT
const gracefulCloseParams = { server, renderer };
const boundGracefulClose = gracefulClose.bind(null, gracefulCloseParams);
process.once("SIGINT", boundGracefulClose);
process.once("SIGTERM", boundGracefulClose);

/* Run the server */

server.listen(PORT, () => {
  console.info(`Server started on port ${PORT}`);
});
