import * as http from "http";
import RollingRenderer from "lib/RollingRenderer";

interface Params {
  server: http.Server;
  renderer: RollingRenderer;
}

export default async ({ server, renderer }: Params) => {
  const webServerPromise = new Promise(resolve => {
    console.info("[API] Shutting down");
    server.close(() => {
      console.info("[API] Shut down");
      resolve();
    });
  });

  const rendererPromise = new Promise(async resolve => {
    console.info("[Renderer] Shutting down");
    await renderer.stop();
    console.info("[Renderer] Shut down");
  });

  await Promise.all([webServerPromise, rendererPromise]);

  process.exit(0); // eslint-disable-line no-process-exit
};
