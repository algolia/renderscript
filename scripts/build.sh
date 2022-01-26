#! /bin/sh

set -e

current=$(node -e "console.log(require('./package.json').version)")
echo "Releasing: $current"
echo ""

docker build \
  --platform=linux/amd64 \
  -t algolia/renderscript \
  -t "algolia/renderscript:${current}" \
  .
