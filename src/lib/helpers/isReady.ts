import renderer from 'lib/rendererSingleton';

export default async function isReady(): Promise<boolean> {
  return await renderer.ready;
}
