import * as puppeteer from "puppeteer";
import * as http from "http";

const PORT = 3001;

function injectBaseHref(origin: string) {
  const base = document.createElement("base");
  base.setAttribute("href", origin);

  const bases = document.head.querySelectorAll("base");
  if (bases.length) {
    // Patch existing <base> if it is relative.
    const existingBase = bases[0].getAttribute("href") || "";
    if (existingBase.startsWith("/")) {
      bases[0].setAttribute("href", origin + existingBase);
    }
  } else {
    // Only inject <base> if it doesn't already exist.
    document.head.insertAdjacentElement("afterbegin", base);
  }
}

async function parse(url: string) {
  const browser = await puppeteer.launch({
    headless: false,
    env: {},
    defaultViewport: {
      width: 1920,
      height: 1080
    },
    args: [
      // No need for GPU and Google recommend against it
      "--disable-gpu",
      // Seems like a powerful hack, not sure why
      // https://github.com/Codeception/CodeceptJS/issues/561
      "--proxy-server='direct://'",
      "--proxy-bypass-list=*",
      /// Disable cache
      "--disk-cache-dir=/dev/null",
      "--media-cache-size=1",
      "--disk-cache-size=1",
      /// Disable useless UI features
      "--no-first-run",
      "--noerrdialogs",
      "--disable-translate",
      "--disable-infobars",
      "--disable-features=TranslateUI"
    ]
  });

  const context = await browser.createIncognitoBrowserContext();

  const page = await context.newPage();
  page.on("console", console.error);

  if (!process.env.IRONHACK_COOKIE)
    throw new Error("Missing IRONHACK_COOKIE env var");
  const initialCookie = process.env.IRONHACK_COOKIE;

  const _cookies = initialCookie
    .split(";")
    .map(cookie => cookie.trim().split("="))
    .map(([name, value]) => ({ name, value }));

  const now = new Date();
  let expiryDate = new Date();
  expiryDate.setDate(now.getDate() + 14);
  const expiry = Number(expiryDate);

  const cookies = _cookies.map(cookie => ({
    name: cookie.name,
    value: cookie.value,
    domain: "learn.ironhack.com",
    path: "/",
    expires: expiry,
    session: false,
    secure: false,
    sameSite: undefined,
    httpOnly: true
  }));

  await page.setCookie(...cookies);

  /*
  const localStoragePage = await context.newPage();
  const localStorageValue = process.env.IRONHACK_LOCAL_STORAGE;

  try {
    await localStoragePage.goto(url, {
      timeout: 10000,
      waitUntil: "networkidle0"
    });
    await localStoragePage.evaluate(
      `localStorage.setItem('sharedVars', '${localStorageValue}');`
    );
  } catch (e) {
    console.error("Error setting local storage");
    console.error(e);
  }

  await localStoragePage.close();
  */

  await page.goto(url, { timeout: 10000, waitUntil: "networkidle0" });

  // Inject <base> tag with the origin of the request (ie. no path).
  const parsedUrl = new URL(url);
  await page.evaluate(
    injectBaseHref,
    `${parsedUrl.protocol}//${parsedUrl.host}`
  );

  const result = await page.evaluate("document.firstElementChild.outerHTML");
  browser.close();

  return result;
}

http
  .createServer(async (req, res) => {
    if (!req.url) {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end();
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    const url = req.url.replace(/^\/render\//, "");
    const parsed = await parse(decodeURIComponent(url));
    res.write(parsed);
    res.end();
  })
  .listen(PORT, function() {
    console.log(`server start at port ${PORT}`);
  });

process.on("unhandledRejection", e => console.error(e));
