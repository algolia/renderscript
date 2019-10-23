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
  * Has adblocking support backed in (thanks to Brave's [`ad-block`](https://github.com/brave/ad-block)) for huge resource consumption gains
* **Resilience**:
  * Has a rolling system to spawn a new Chrome after a specific amount of pages processed to lower RAM usage
* **Features**:
  * Allows for extension injection (*discouraged* - this requires running the browser in headful mode, which consumes way more resources)
* **Misc**:
  * Bundles an optimized `Dockerfile` for easy deployment

## API

> POST `/render`

Main endpoint. Renders the page and dumps a JSON with all the page information.

Body parameters:
- `url`: URL to render (for hash and query params support, use `encodeURIComponent` on it)

Returns `application/json`:
- `statusCode <number>`: HTTP Status Code
- `headers <{ [key: string]: string }>`: Page headers (keys are lowercase)
- `body <string>`: Page raw HTML content

> GET `/render`

Used for debug purposes. Dumps directly the HTML for easy inspection in your browser.

Query parameters:
- `url`: URL to render (for hash and query params support, use `encodeURIComponent` on it)

Returns `text/html`.
(CSP headers are set to prevent script execution on the rendered page)

## Running it locally

Simply run:
```sh
docker run -p 23000:3000 algolia/renderscript
open http://localhost:3000/render?url=https%3A%2F%2Fwww.algolia.com
```

### Parameters

See `.env.prod` to see which ones are installed by default (they still need to be provided to `docker run` to be enabled).

- `ADBLOCK_LISTS`: Comma separated list of adblocking lists download link  
  Example: `https://easylist.to/easylist/easylist.txt`
- `EXTENSIONS`: Comma separated list of extensions download link (expects a `.zip` file)  
  Example: `https://github.com/gorhill/uBlock/releases/download/1.19.6/uBlock0_1.19.6.chromium.zip`
- `ALLOW_LOCALHOST`: Allow calls on localhost IPs
  Example: `ALLOW_LOCALHOST=true`

## Credits

This project is heavily inspired by [`GoogleChrome/rendertron`](https://github.com/GoogleChrome/rendertron).
It is based on [`puppeteer-core`](https://github.com/GoogleChrome/puppeteer).
