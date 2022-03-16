#! /bin/bash

set -ex

hash=$(git rev-parse HEAD) # the last commit change because of semantic-release
docker run -d --name renderscript_test -p 3000:3000 algolia/renderscript:$hash

echo "waiting for docker"
sleepSec=10
sleep $sleepSec

echo "slept for $sleepSecs"

launched=$(docker logs renderscript_test 2>&1 | grep '"svc":"brws","msg":"Ready"')

if [ -z "$launched" ]; then
  echo "Not ready"
  exit 1
fi

echo "Ready"
