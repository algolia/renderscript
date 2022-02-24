#! /bin/sh

set -ex

hash=$(git rev-parse HEAD)
current=$(node -e "console.log(require('./package.json').version)")
echo "Releasing: $current"
echo ""

docker build \
  --progress plain \
  -t "algolia/renderscript:${hash}" \
  --build-arg "VERSION=${current}" \
  .
