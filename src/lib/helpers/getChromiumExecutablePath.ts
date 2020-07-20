import * as puppeteer from 'puppeteer-core';

export default async function getChromiumExecutablePath() {
  const revisions = require('puppeteer-core/lib/cjs/puppeteer/revisions.js');
  const {
    PUPPETEER_REVISIONS: { chromium: revision },
  } = revisions;

  const fetcher = puppeteer.createBrowserFetcher();
  const localRevisions = await fetcher.localRevisions();

  let revisionInfo;
  if (localRevisions.includes(revision)) {
    revisionInfo = fetcher.revisionInfo(revision);
    console.info(`Local Chromium rev ${revision} already present`);
  } else {
    console.info(`Downloading Chromium rev ${revision}...`);
    revisionInfo = await fetcher.download(revision);
    console.info(`Downloaded Chromium rev ${revision}`);
  }

  return revisionInfo.executablePath;
}
