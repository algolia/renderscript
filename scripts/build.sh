#! /bin/sh

set -ex

hash=$(git rev-parse HEAD)
current=$(node -e "console.log(require('./package.json').version)")
echo "Releasing: $current"
echo ""

# Build base image

docker build \
  --progress plain \
  -t algolia/renderscript-pw-chromium \
  --build-arg "VERSION=${current}" \
  -f Dockerfile.pw \
  .

docker build \
  --progress plain \
  -t algolia/renderscript \
  -t "algolia/renderscript:${current}" \
  -t "algolia/renderscript:${hash}" \
  --build-arg "VERSION=${current}" \
  .
