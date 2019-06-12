import * as http from "http";

import Api from "api/index";
import RollingRenderer from "lib/RollingRenderer";

interface Params {
  api: Api;
  renderer: RollingRenderer;
}

let gracefullyClosing = false;

async function close({ api, renderer }: Params) {
  const webServerPromise = new Promise(resolve => {
    console.info("[API] Shutting down");
    api.stop(() => {
      console.info("[API] Shut down");
      resolve();
    });
  });

  await webServerPromise;

  const rendererPromise = new Promise(async resolve => {
    console.info("[Renderer] Shutting down");
    await renderer.stop();
    console.info("[Renderer] Shut down");
    resolve();
  });

  await rendererPromise;

  console.info("Gracefully stopped everything");

  process.exit(0);
}

export default ({ api, renderer }: Params) => {
  // If we receive multiple signals, swallow them
  if (gracefullyClosing) {
    return;
  }

  gracefullyClosing = true;
  close({ api, renderer });
};
