#! /bin/bash

set -e

hash=$1 # the last commit change because of semantic-release
docker run -d --name renderscript_test -p 3000:3000 algolia/renderscript:$hash

ATTEMPTS=10
until $(curl -o /dev/null -s -f http://localhost:3000/ready); do
  echo "waiting for docker..."
  sleep 1
  ((ATTEMPTS=ATTEMPTS-1))
  if [[ $ATTEMPTS -eq "0" ]]; then
    echo "Timed out, check the logs of renderscript_test container"
    exit 1
  fi
done

logs=$(docker logs renderscript_test 2>&1)
echo $logs

if echo $logs | grep -q '"svc":"brws","msg":"Browser ready"'; then
  echo "Browser ready"
else
  echo "Browser not ready"
  exit 1
fi

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

if echo $logs | grep -q '"msg":"Done","data":'; then
  echo "Rendered"
else
  echo "Not rendered"
  exit 1
fi

echo "Image OK"
docker stop renderscript_test && docker rm renderscript_test
