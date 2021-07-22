#! /bin/sh

set -e

current=$(node -e "console.log(require('./package.json').version)")
echo "Releasing: $current"
echo ""

docker build \
  -t algolia/renderscript \
  -t "algolia/renderscript:${current}" \
  .
