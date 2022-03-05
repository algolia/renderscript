# Renderscript

> An API to render a page inside a real Chromium (with JavaScript enabled) and send back the raw HTML.

This project is directly written and consumed by [Algolia Crawler](https://www.algolia.com/products/search-and-discovery/crawler/).

🔐  **Secure**
Leverages `Context` to isolate each page, prevent cookie sharing, control redirection, etc...

🚀  **Performant**:
Ignores unnecessary resources for rendering HTML (e.g. `images`, `video`, `font`, etc...) and bundle an AdBlocker by default.

🤖 **Automated**:
Renderscript have everything abstracted to render a page and login to website with minimal configuration required.

## Usage

```sh
docker run -it algolia/renderscript
# or
yarn dev
```

**Goto**: <http://localhost:3000>

## API

- [`POST /render`](#post-render)
- [`GET /render`](#get-render)
- [`POST /login`](#post-login)
- [`GET /list`](#get-list)
- [`GET /healthy`,  `GET /ready`](#get-healthy--get-ready)

---

### `POST /render`

Main endpoint. Renders the page and dumps a JSON with all the page information.

#### Body parameters:

```ts
{
  /**
   * URL to render (for hash and query params support, use `encodeURIComponent` on it)
   */
  url: string;

  /**
   * User-Agent to use.
   */
  ua: string;

  /**
   * Enables AdBlocker
   */
  adblock?: boolean;

  /**
   * Define the range of time.
   * Minimum and maximum execution time.
   */
  waitTime?: {
    min?: number;
    max?: number;
  };

  /**
   * Headers to Forward on navigation
   */
  headersToForward: {
    [s: string]: string;
  };
}
```

#### Response `application/json`:

```ts
{
  /**
   * HTTP Code of the rendered page.
   */
  statusCode: number | null;

  /**
   * HTTP Headers of the rendered page.
   */
  headers: Record<string, string>;

  /**
   * Body of the rendered page.
   */
  body: string | null;

  /**
   * Metrics from different taks during the rendering.
   */
  metrics: Metrics;

  /**
   * The redirection renderscript caught.
   */
  resolvedUrl: string | null;

  /**
   * Has the page reached timeout?
   * When timeout has been reached we continue the rendering as usual
   * but reduce other timeout to a minimum.
   */
  timeout: boolean;

  /**
   * Any error encountered along the way.
   * If this field is filled that means the rest of the payload is partial.
   */
  error: string | null;
}
```

---

### `GET /render`

Used for debug purposes. Dumps directly the HTML for easy inspection in your browser.

#### Query parameters:

- `url`: URL to render (for hash and query params support, use `encodeURIComponent` on it)
- `ua`: User-Agent
- `waitTime[min]&waitTime[max]`: minimum and maximum execution time

#### Response `text/html`.

(CSP headers are set to prevent script execution on the rendered page)

---

### `POST /login`

This endpoint will load a given login page, look for `input` fields, enter the given credentials and validate the form.
It allows retrieving programmatically a session-cookie from websites with [CSRF](https://en.wikipedia.org/wiki/Cross-site_request_forgery) protection.

#### Body parameters

- `url`: URL of the login page
- `username`: Username to enter on the login form. Renderscript expects to find an `input[type=text]` or `input[type=email]` on the login page.
- `password`: Password to enter on the login form. Renderscript expects to find an `input[type=password]` on the login page.
- `ua`: User-Agent
- `renderHTML`: Boolean (optional). If set to true, Renderscript will return the rendered HTML after the login request. Useful to debug visually.

#### Response `application/json`

```json

```

- `statusCode <number>`: HTTP Status Code.
- `headers <{ [key: string]: string }>`: Response headers received on the login request.
- `cookies` <[https://chromedevtools.github.io/devtools-protocol/tot/Network/#type-Cookie](Cookie)[]>: Browser cookies after the login request.
- `timeout <boolean>`: Present only if the login operation took too long.

If `renderHTML: true`, returns `text/html`.
(CSP headers are set to prevent script execution on the rendered page)

---

### `GET /list`

List currenlty open pages.
Useful to debug.

---

### `GET /healthy`,  `GET /ready`

Health Check for Kubernetes and others.

---

## Credits

This project was heavily inspired by [`GoogleChrome/rendertron`](https://github.com/GoogleChrome/rendertron).
It was based on [`puppeteer-core`](https://github.com/GoogleChrome/puppeteer) but we switched to [Playwright](https://playwright.dev/).
