#! /bin/sh

set -e

current=$(npx json -f package.json version)
echo "Releasing: $current"
echo ""

# Reads its args from .env.prod
if [ -f .env.prod ]; then
  source .env.prod
fi

docker build \
  -t algolia/renderscript \
  -t "algolia/renderscript:${current}" \
  --build-arg extensions_cache="$EXTENSIONS" \
  --build-arg adblock_lists_cache="$ADBLOCK_LISTS" \
  .
