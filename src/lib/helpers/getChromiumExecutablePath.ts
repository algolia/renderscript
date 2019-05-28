import * as puppeteer from "puppeteer-core";

export default async function getChromiumExecutablePath() {
  const pkg = require("puppeteer-core/package.json");
  const { chromium_revision: revision } = pkg.puppeteer;

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
