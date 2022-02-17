#! /bin/bash

set -ex

docker run -d --platform linux/amd64 --name renderscript_test -p 3000:3000 algolia/renderscript:$CIRCLE_SHA1

echo "waiting for docker"
sleep 20

echo "slept for 20s"

launched=$(docker logs renderscript_test 2>&1 | grep "Browser is ready")

if [ -z "$launched" ]; then
  echo "Not ready"
  exit 1
fi

echo "Ready"
