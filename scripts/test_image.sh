#! /bin/bash

set -ex

hash=$(git rev-parse HEAD) # the last commit change because of semantic-release
docker run -d --platform linux/amd64 --name renderscript_test -p 3000:3000 algolia/renderscript:$hash

echo "waiting for docker"
sleep 20

echo "slept for 20s"

launched=$(docker logs renderscript_test 2>&1 | grep "Browser is ready")

if [ -z "$launched" ]; then
  echo "Not ready"
  exit 1
fi

echo "Ready"
