import * as fs from 'fs';
import * as path from 'path';

function hasRuntimeAssets(dir: string): boolean {
  return (
    fs.existsSync(path.join(dir, 'package.json')) &&
    fs.existsSync(path.join(dir, 'public'))
  );
}

// Support bundled builds (`dist/index.js`) as well as source/test execution.
const candidates = [
  process.cwd(),
  path.resolve(__dirname, '..'),
  path.resolve(__dirname, '..', '..'),
];

function resolveProjectRoot(): string {
  const projectRoot = candidates.find(hasRuntimeAssets);

  if (projectRoot) {
    return projectRoot;
  }

  throw new Error(
    `Unable to resolve project root from: ${candidates.join(', ')}`
  );
}

export default resolveProjectRoot();
