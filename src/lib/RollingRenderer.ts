import Renderer, { taskParams } from "lib/Renderer";

const MAX_RENDERER_TASKS = 200;

class RollingRenderer {
  private _currentRenderer: Renderer;
  private _futureRenderer: Renderer | null;
  private _previousStopPromise: Promise<void> | null;

  constructor() {
    this._currentRenderer = new Renderer();
    this._futureRenderer = null;
    this._previousStopPromise = null;
  }

  get renderer() {
    const { nbTotalTasks } = this._currentRenderer;
    // Do not rely on nbTotalTasks incrementing 1 by 1

    // Before the limit, use the current renderer
    if (nbTotalTasks < MAX_RENDERER_TASKS) {
      return this._currentRenderer;
    }

    // On the limit, create a new one
    if (!this._futureRenderer) {
      this._futureRenderer = new Renderer();
    }

    // After the limit, send back the old one until the new one is ready

    // This should never happen, but this is to make sure we **never**
    // lose the reference to a stopping browser
    const previousStopped = this._previousStopPromise === null;
    if (!previousStopped) return this._currentRenderer;

    // Only use the future one if it's ready
    const { ready: futureReady } = this._futureRenderer as Renderer;
    if (!futureReady) return this._currentRenderer;

    this._stopCurrentRenderer();
    this._currentRenderer = this._futureRenderer as Renderer;
    this._futureRenderer = null;
    return this._currentRenderer;
  }

  async task(job: taskParams) {
    return await this.renderer.task(job);
  }

  async stop() {
    if (this._previousStopPromise) {
      await this._previousStopPromise;
    }
    await this._currentRenderer.stop();
  }

  get ready() {
    return this.renderer.ready;
  }

  async healthy() {
    return await this.renderer.healthy();
  }

  private _stopCurrentRenderer() {
    this._previousStopPromise = this._currentRenderer.stop().then(() => {
      this._previousStopPromise = null;
    });
  }
}

export default RollingRenderer;
