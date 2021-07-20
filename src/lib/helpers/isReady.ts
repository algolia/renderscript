import renderer from 'lib/rendererSingleton';

export function isReady(): boolean {
  return renderer.ready;
}
