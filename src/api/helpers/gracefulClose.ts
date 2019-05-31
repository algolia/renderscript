import * as http from "http";
import RollingRenderer from "lib/RollingRenderer";

interface Params {
  server: http.Server;
  renderer: RollingRenderer;
}

let gracefullyClosing = false;

export default ({ server, renderer }: Params) => {
  // If we receive multiple signals, swallow them
  if (gracefullyClosing) return;
  gracefullyClosing = true;

  (async () => {
    const rendererPromise = new Promise(async resolve => {
      console.info("[Renderer] Shutting down");
      await renderer.stop();
      console.info("[Renderer] Shut down");
      resolve();
    });

    await rendererPromise;

    const webServerPromise = new Promise(resolve => {
      console.info("[API] Shutting down");
      server.close(() => {
        console.info("[API] Shut down");
        resolve();
      });
    });

    await webServerPromise;

    console.info("Gracefully stopped everything");

    process.exit(0);
  })();
};
