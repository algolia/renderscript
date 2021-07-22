#! /bin/sh

set -e

current=$(node -e "console.log(require('./package.json').version)")
echo "Releasing: $current"
echo ""

# Reads its args from .env.prod
if [ -f .env.prod ]; then
  source .env.prod
fi

docker build \
  -t algolia/renderscript \
  -t "algolia/renderscript:${current}" \
  .
