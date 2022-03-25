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
open http://localhost:3000/render?url=https%3A%2F%2Fwww.algolia.com&ua=Test+Renderscript
```

### Env Variables

See `.env.example`

## Releasing

> The release is an automated process in the CI, there is nothing to do.

### Manual Release Using Github

If no version has been created: make a new version by pushing a commit with semantic-release format:

```sh
git commit --allow-empty -m "fix: bump version"
```

Then build and release

```sh
# Push to trigger the github workflow
git push

# Or manual trigger
gh workflow run release_docker.yml -f is_release=false --ref fix/use-github-actions
```

### Manual Release Locally

```sh
yarn docker:build

docker push "algolia/renderscript"
docker push "algolia/renderscript:${VERSION}"
docker push "algolia/renderscript:${GIT_HASH}"
```
