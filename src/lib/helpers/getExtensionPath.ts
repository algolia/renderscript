import { promises as fs } from 'fs';
import * as path from 'path';

import fetch from 'node-fetch';
import * as yauzl from 'yauzl-promise';
import * as streamToString from 'stream-to-string';

import projectRoot from 'helpers/projectRoot';

const EXTENSION_SOURCES: string[] = process.env.EXTENSIONS
  ? process.env.EXTENSIONS.split(',').map((src) =>
      decodeURIComponent(src.trim())
    )
  : [];
const EXTENSION_SOURCES_MAP: { [s: string]: string } = EXTENSION_SOURCES.reduce(
  (res, src) => ({ ...res, [path.basename(src, '.zip')]: src }),
  {}
);

export const EXTENSIONS = Object.keys(EXTENSION_SOURCES_MAP);

export default async function getExtensionPath(name: string) {
  const modulesPath = path.resolve(projectRoot, 'vendors', 'extensions');
  await fs.mkdir(modulesPath).catch(() => {});
  const dirPath = path.resolve(modulesPath, name);
  try {
    // If directory already exists, just send this back
    await fs.stat(dirPath);
    console.info(`Local extension "${name}" already present`);
    return dirPath;
  } catch (e) {
    console.info(`Downloading extension ${name}...`);
    const res = await fetch(EXTENSION_SOURCES_MAP[name]);
    const buffer = Buffer.from(await res.arrayBuffer());

    // Unzip extension
    const zipFile = await yauzl.fromBuffer(buffer);
    let folderName;
    let entry;
    while ((entry = await zipFile.readEntry())) {
      // Skip folders
      if (entry.fileName.match(/\/$/)) continue;
      // Replace main folder name
      const splitted = entry.fileName.split(path.sep);
      const subPath = path.join(...[name, ...splitted.slice(1)]);
      const readStream = await entry.openReadStream();
      const content = await streamToString(readStream);
      const fullPath = path.resolve(modulesPath, subPath);
      const dirname = path.dirname(fullPath);
      try {
        await fs.mkdir(dirname, { recursive: true });
      } catch (err) {
        if (err.code !== 'EEXISTS') throw err;
      }
      await fs.writeFile(fullPath, content);
    }

    console.info(`Downloaded extension ${name}`);
    return dirPath;
  }
}
