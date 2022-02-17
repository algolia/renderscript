#! /bin/sh

set -ex

hash=$(git rev-parse HEAD)
current=$(node -e "console.log(require('./package.json').version)")
echo "Releasing: $current"
echo ""

docker build \
  -t algolia/renderscript \
  -t "algolia/renderscript:${current}" \
  -t "algolia/renderscript:${hash}" \
  .
