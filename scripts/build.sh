#! /bin/sh

set -ex

hash=$(git rev-parse HEAD)
current=$(node -e "console.log(require('./package.json').version)")
echo "Releasing: $current"
echo ""

# Build base image

docker buildx build \
  --platform linux/arm64/v8,linux/amd64 \
  --progress plain \
  -t algolia/renderscript-pw-chromium:${current} \
  --build-arg "VERSION=${current}" \
  -f Dockerfile.pw \
  .

# Build renderscript

docker buildx build \
  --platform linux/arm64/v8,linux/amd64 \
  --progress plain \
  -t algolia/renderscript \
  -t "algolia/renderscript:${current}" \
  -t "algolia/renderscript:${hash}" \
  --build-arg "VERSION=${current}" \
  .
