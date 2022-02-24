#! /bin/sh

set -ex

hash=$(git rev-parse HEAD)
current=$(node -e "console.log(require('./package.json').version)")

echo "Pushing: $current"
echo ""

# docker push "algolia/renderscript"
# docker push "algolia/renderscript:${current}"
docker push "algolia/renderscript:${hash}"
