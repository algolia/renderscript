import * as http from "http";
import * as express from "express";
import * as bodyParser from "body-parser";

import gracefulClose from "api/helpers/gracefulClose";
import requestLogger from "api/helpers/requestLogger";

import * as render from "api/routes/render";
import ready from "api/routes/ready";
import healthy from "api/routes/healthy";

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
  .get("/ready", ready)
  .get("/healthy", healthy)
  .get("/render", render.getURLFromQuery, render.validateURL, render.render)
  .post("/render", render.getURLFromBody, render.validateURL, render.render);

/* Error handling */

// Uncaught Promise Rejection
process.on("unhandledRejection", async reason => {
  console.error("Unhandled rejection");
  console.error(reason);

  process.exit(1);
});

// Handle SIGINT
const gracefulCloseParams = { server, renderer };
const boundGracefulClose = gracefulClose.bind(null, gracefulCloseParams);
process.on("SIGINT", boundGracefulClose);
process.on("SIGTERM", boundGracefulClose);

/* Run the server */

server.listen(PORT, () => {
  console.info(`Server started on port ${PORT}`);
});
