import renderer from "lib/rendererSingleton";

export default async function isReady() {
  return await renderer.ready;
}

