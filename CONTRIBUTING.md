# Contributing

## Running it locally

Development:

```sh
yarn
yarn dev
```

Docker image:

```sh
yarn docker:build
docker run -p 23000:3000 algolia/renderscript
open "http://localhost:23000/render?url=https%3A%2F%2Fwww.algolia.com&ua=Test+Renderscript"
```

### Env Variables

See `.env.example`

## Releasing

> Releases are built using GitHub actions. You can release a new version by triggering the [Release Version](https://github.com/algolia/renderscript/actions/workflows/release.yml) workflow.

### Manual Release Locally

```sh
yarn docker:build

docker push "algolia/renderscript"
docker push "algolia/renderscript:${VERSION}"
docker push "algolia/renderscript:${GIT_HASH}"
```
