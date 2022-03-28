#! /bin/bash

set -e

hash=$1 # the last commit change because of semantic-release
docker run -d --name renderscript_test -p 3000:3000 algolia/renderscript:$hash

echo "waiting for docker"
sleepSec=10
sleep $sleepSec

echo "slept for ${sleepSec}s"

curl --silent --request POST \
  --url http://localhost:3000/render \
  --header 'Content-Type: application/json' \
  --data '{
	"url": "https://www.example.com",
	"ua": "Renderscript CI",
	"waitTime": {
		"min": 1000,
		"max": 3000
	}
}' >/dev/null

logs=$(docker logs renderscript_test 2>&1)
echo $logs

launched=$(echo $logs | grep '"svc":"brws","msg":"Ready"')
if [ -z "$launched" ]; then
  echo "Not ready"
  exit 1
fi

rendered=$(echo $logs | grep '"msg":"Done","data":')
if [ -z "$rendered" ]; then
  echo "Not rendered"
  exit 1
fi

echo "Ready"
docker stop renderscript_test && docker rm renderscript_test
