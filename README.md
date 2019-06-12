**WARNING**
This project is not an officially maintained Algolia project.
This repository should not be used for any production project.
Bug reports and feature requests will most likely be ignored.
If you'd like to use it, you most likely should check out [`GoogleChrome/rendertron`](https://github.com/GoogleChrome/rendertron) instead.

# Renderscript

> An API to render a page inside a real Chromium (with JavaScript enabled) and return the HTML.

## API

> POST `/render`

Main endpoint. Renders the page and dumps a JSON with all the page information.

Body parameters:
- `url`: URL to render (for hash and query params support, use `encodeURIComponent` on it)

Returns `application/json`:
- `statusCode <number>`: HTTP Status Code
- `headers <{ [key: string]: string }>`: Page headers (keys are lowercase)
- `content <string>`: Page raw HTML content

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
```

### Parameters

See `.env.prod` to see which ones are installed by default (they still need to be provided to `docker run` to be enabled).

- `ADBLOCK_LISTS`: Comma separated list of adblocking lists download link
  Example: `https://easylist.to/easylist/easylist.txt`
- `EXTENSIONS`: Comma separated list of extensions download link (expects a `.zip` file).
  Example: `https://github.com/gorhill/uBlock/releases/download/1.19.6/uBlock0_1.19.6.chromium.zip`

## Credits

This project is functionally a clone (and heavily inspired) of [`GoogleChrome/rendertron`](https://github.com/GoogleChrome/rendertron).
It is based on [`puppeteer-core`](https://github.com/GoogleChrome/puppeteer).
