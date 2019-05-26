import * as uuid from "uuid/v4";
import Renderer, { taskParams } from "lib/Renderer";

const MAX_RENDERER_TASKS = 1000;

class RollingRenderer {
  private _currentRendererId: string;
  private _currentRenderer: Renderer;
  private _stoppingPromises: { id: string; promise: Promise<void> }[];

  constructor() {
    this._currentRendererId = uuid();
    this._currentRenderer = new Renderer();
    this._stoppingPromises = [];
  }

  get renderer() {
    if (this._currentRenderer.nbTotalTasks < MAX_RENDERER_TASKS) {
      return this._currentRenderer;
    }
    // Create new renderer if current dealt with more than MAX_RENDERER_TASKS tasks
    this._stopCurrentRenderer();
    this._currentRendererId = uuid();
    this._currentRenderer = new Renderer();
    return this._currentRenderer;
  }

  async task(job: taskParams) {
    return await this.renderer.task(job);
  }

  async stop() {
    this._stopCurrentRenderer();
    await this._stoppingPromises.map(({ promise }) => promise);
  }

  private _stopCurrentRenderer() {
    const id = this._currentRendererId;
    const promise = this._currentRenderer.stop().then(() => {
      this._stoppingPromises.splice(
        this._stoppingPromises.findIndex(({ id: _id }) => id === _id),
        1
      );
    });

    this._stoppingPromises.push({ id, promise });
  }
}

export default RollingRenderer;
