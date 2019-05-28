import { promises as fs } from "fs";
import * as path from "path";
import fetch from "node-fetch";
import * as yauzl from "yauzl-promise";
import * as streamToString from "stream-to-string";

import projectRoot from "projectRoot";

const EXTENSION_SOURCES: { [s: string]: string } = {
  "ublock@1.19.6":
    "https://github.com/gorhill/uBlock/releases/download/1.19.6/uBlock0_1.19.6.chromium.zip"
};

export const EXTENSIONS = Object.keys(EXTENSION_SOURCES);

export default async (name: string) => {
  const modulesPath = path.resolve(projectRoot, "node_modules", ".extensions");
  await fs.mkdir(modulesPath).catch(() => {});
  const dirPath = path.resolve(modulesPath, name);
  try {
    // If directory already exists, just send this back
    await fs.stat(dirPath);
    console.info(`Local extension "${name}" already present`);
    return dirPath;
  } catch (e) {
    console.info(`Downloading extension ${name}...`);
    const res = await fetch(EXTENSION_SOURCES[name]);
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
        if (err.code !== "EEXISTS") throw err;
      }
      await fs.writeFile(fullPath, content);
    }

    console.info(`Downloaded extension ${name}`);
    return dirPath;
  }
};
