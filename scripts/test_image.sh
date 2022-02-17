#! /bin/sh

set -ex

docker run -d --platform linux/amd64 --name renderscript_test -p 3000:3000 algolia/renderscript:$CIRCLE_SHA1

echo "waiting for docker"
sleep 20

echo "slept for 20s"

docker logs renderscript_test

curl -XPOST -i "http://localhost:3000/render" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.algolia.com", "ua": "test"}' >test.json

cat test.json

echo "testouille"
