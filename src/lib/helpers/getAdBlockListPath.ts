import { promises as fs } from 'fs';
import * as path from 'path';

import fetch from 'node-fetch';
import projectRoot from 'helpers/projectRoot';

const ADBLOCK_LIST_SOURCES: string[] = process.env.ADBLOCK_LISTS
  ? process.env.ADBLOCK_LISTS.split(',').map((src) =>
      decodeURIComponent(src.trim())
    )
  : [];

const ADBLOCK_LIST_SOURCES_MAP: {
  [s: string]: string;
} = ADBLOCK_LIST_SOURCES.reduce(
  (res, src) => ({ ...res, [path.basename(src)]: src }),
  {}
);

export const ADBLOCK_LISTS = Object.keys(ADBLOCK_LIST_SOURCES_MAP);

export default async function getAdblockListPath(name: string) {
  const dirPath = path.join(projectRoot, 'vendors', 'adblock-lists');
  try {
    await fs.stat(dirPath);
  } catch (e) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXISTS') throw err;
    }
  }
  const filePath = path.join(dirPath, name);
  // If file already exists, just send this back
  try {
    await fs.stat(filePath);
    console.info(`Adblock list "${name}" already present`);
  } catch (e) {
    console.info(`Downloading adblock list "${name}"...`);
    const res = await fetch(ADBLOCK_LIST_SOURCES_MAP[name]);
    const body = await res.text();
    await fs.writeFile(filePath, body);
    console.info(`Downloaded adblock list "${name}"`);
  }
  return filePath;
}
