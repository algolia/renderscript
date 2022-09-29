#! /bin/sh

set -ex

hash=$(git rev-parse HEAD)
current=$(node -e "console.log(require('./package.json').version)")
echo "Releasing: $current"
echo ""

# Build renderscript

# To run locally on your mac m1, you need to change platform to linux/arm64/v8
# For deploy, it should be linux/amd64
docker buildx build \
  --platform linux/amd64 \
  --progress plain \
  -t algolia/renderscript \
  -t "algolia/renderscript:${current}" \
  -t "algolia/renderscript:${hash}" \
  -t "algolia/renderscript:latest" \
  --build-arg "VERSION=${current}" \
  --load \
  .
