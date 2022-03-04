**WARNING**
This project is not an officially maintained Algolia project.
This repository should not be used for any production project.
Bug reports and feature requests will most likely be ignored.
If you'd like to use it, you most likely should check out [`GoogleChrome/rendertron`](https://github.com/GoogleChrome/rendertron) instead.

# Renderscript

> An API to render a page inside a real Chromium (with JavaScript enabled) and send back the raw HTML.

This project is heavily inspired by Google's [`rendertron`](https://github.com/GoogleChrome/rendertron) project.
The aim is to make a more reliable and more flexible version for long-term use.

* **Security**:
  * Leverages `puppeteer`'s [`createIncognitoBrowserContext`](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#browsercreateincognitobrowsercontext) to isolate each page and prevent cookie sharing.
* **Performance**:
  * Ignores useless resources for rendering HTML (e.g. `images`)
* **Resilience**:
  * Has a rolling system to spawn a new Chrome after a specific amount of pages processed to lower RAM usage
* **Features**:
  * Allows for extension injection (*discouraged* - this requires running the browser in headful mode, which consumes way more resources)
* **Misc**:
  * Bundles an optimized `Dockerfile` for easy deployment

## API

### GET `/healthy` GET `/ready`

For Kubernetes and others.

### GET `/list`

List currenlty open pages.
Useful to debug.

### POST `/render`

Main endpoint. Renders the page and dumps a JSON with all the page information.

#### Body parameters:

* `url`: URL to render (for hash and query params support, use `encodeURIComponent` on it)
* `ua`: User-Agent
* `waitTime: { min: number, max: number}`: minimum and maximum execution time

#### Returns `application/json`:

* `statusCode <number>`: HTTP Status Code
* `headers <{ [key: string]: string }>`: Page headers (keys are lowercase)
* `body <string>`: Page raw HTML content
* `timeout <boolean>`: Present only if the page took too long to render

### GET `/render`

Used for debug purposes. Dumps directly the HTML for easy inspection in your browser.

#### Query parameters:

* `url`: URL to render (for hash and query params support, use `encodeURIComponent` on it)
* `ua`: User-Agent
* `waitTime[min]&waitTime[max]`: minimum and maximum execution time

#### Returns `text/html`.

(CSP headers are set to prevent script execution on the rendered page)

### POST `/login`

This endpoint will load a given login page, look for `input` fields, enter the given credentials and validate the form.
It allows retrieving programmatically a session-cookie from websites with [CSRF](https://en.wikipedia.org/wiki/Cross-site_request_forgery) protection.

#### Body parameters

* `url`: URL of the login page
* `username`: Username to enter on the login form. Renderscript expects to find an `input[type=text]` or `input[type=email]` on the login page.
* `password`: Password to enter on the login form. Renderscript expects to find an `input[type=password]` on the login page.
* `ua`: User-Agent
* `renderHTML`: Boolean (optional). If set to true, Renderscript will return the rendered HTML after the login request. Useful to debug visually.

#### Returns `application/json`

* `statusCode <number>`: HTTP Status Code.
* `headers <{ [key: string]: string }>`: Response headers received on the login request.
* `cookies` <[https://chromedevtools.github.io/devtools-protocol/tot/Network/#type-Cookie](Cookie)[]>: Browser cookies after the login request.
* `timeout <boolean>`: Present only if the login operation took too long.

If `renderHTML: true`, returns `text/html`.
(CSP headers are set to prevent script execution on the rendered page)

## Credits

This project was heavily inspired by [`GoogleChrome/rendertron`](https://github.com/GoogleChrome/rendertron).
It was based on [`puppeteer-core`](https://github.com/GoogleChrome/puppeteer) but we switched to [Playwright](https://playwright.dev/).
