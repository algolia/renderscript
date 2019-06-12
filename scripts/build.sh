#! /bin/sh

set -e

# Reads its args from .env.prod
if [ -f .env.prod ]; then
  source .env.prod
fi

docker build \
  -t algolia/renderscript \
  --build-arg extensions_cache="$EXTENSIONS" \
  --build-arg adblock_lists_cache="$ADBLOCK_LISTS" \
  .
