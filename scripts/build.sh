#! /bin/sh

set -ex

hash=$(git rev-parse HEAD)
current=$(node -e "console.log(require('./package.json').version)")
playwright_version=$(node -e 'console.log(require("./package.json").dependencies.playwright)')
echo "Releasing: $current ; Playwright version: $playwright_version"
echo ""

# Build renderscript

# To run locally on your mac m1, you need to change platform to linux/arm64/v8
# For deploy, it should be linux/amd64
# USE_LATEST_CHROME will help you download
docker buildx build \
  --platform linux/amd64 \
  --progress plain \
  -t algolia/renderscript \
  -t "algolia/renderscript:${current}" \
  -t "algolia/renderscript:${hash}" \
  -t "algolia/renderscript:latest" \
  --build-arg "VERSION=${current}" \
  --build-arg "USE_LATEST_CHROME=true" \
  --build-arg "PLAYWRIGHT_VERSION=${playwright_version}" \
  --load \
  .
