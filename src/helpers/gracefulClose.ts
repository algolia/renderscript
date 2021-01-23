import type Api from 'api/index';
import type RollingRenderer from 'lib/RollingRenderer';

interface Params {
  api: Api;
  renderer: RollingRenderer;
}

let gracefullyClosing = false;

async function close({ api, renderer }: Params) {
  const webServerPromise = new Promise<void>((resolve) => {
    console.info('[API] Shutting down');
    api.stop(() => {
      console.info('[API] Shut down');
      resolve();
    });
  });

  await webServerPromise;

  console.info('[Renderer] Shutting down');
  await renderer.stop();
  console.info('[Renderer] Shut down');

  console.info('Gracefully stopped everything');

  // eslint-disable-next-line no-process-exit
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
