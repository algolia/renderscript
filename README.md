# Renderscript

> An API to render a page inside a real Chromium (with JavaScript enabled) and send back the raw HTML.

This project is directly written for and consumed by [Algolia Crawler](https://www.algolia.com/products/search-and-discovery/crawler/).

🔐  **Secure**
Leverages `Context` to isolate each page, prevent cookie sharing, control redirection, etc...

🚀  **Performant**:
Ignores unnecessary resources for rendering HTML (e.g. `images`, `video`, `font`, etc...) and bundle an AdBlocker by default.

🤖 **Automated**:
Renderscript has everything abstracted to render a page and login to website with minimal configuration required.

## Usage

### Local

```sh
yarn dev
```

**Goto**: <http://localhost:3000>

### Docker

```sh
docker run -p 3000:3000 -it algolia/renderscript

curl -X POST http://localhost:3000/render \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://www.algolia.com/", "ua": "local_renderscript"}'
```

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
  headersToForward?: {
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

> see `POST /login` parameters

#### Response `text/html`.

CSP headers are set to prevent script execution on the rendered page.

---

### `POST /login`

This endpoint will load a given login page, look for `input` fields, enter the given credentials and validate the form.
It allows retrieving programmatically a session-cookie from websites with [CSRF](https://en.wikipedia.org/wiki/Cross-site_request_forgery) protection.

#### Body parameters

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
   * Username to enter on the login form. Renderscript expects to find an `input[type=text]` or `input[type=email]` on the login page.
   */
  username: string;

  /**
   * Password to enter on the login form. Renderscript expects to find an `input[type=password]` on the login page.
   */
  password: string;

  /**
   * Define the range of time.
   * Minimum and maximum execution time.
   */
  waitTime?: {
    min?: number;
    max?: number;
  };

  /**
   * Boolean (optional).
   * If set to true, Renderscript will return the rendered HTML after the login request. Useful to debug visually.
   */
  renderHTML?: boolean;
}
```

#### Response `application/json`

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
   * Metrics from different taks during the rendering.
   */
  metrics: Metrics;

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

  /**
   * Cookie generated from a succesful login.
   */
  cookies: Cookie[];

  /**
   * The URL at the end of a succesful login.
   */
  resolvedUrl: string | null;

  /**
   * Body at the end of a succesful login.
   */
  body: string | null;
}
```

#### Response `text/html`

If `renderHTML: true`, returns `text/html`.
CSP headers are set to prevent script execution on the rendered page.

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
