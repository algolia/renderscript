#!/usr/bin/env bash

set -euo pipefail

hash="${1:?missing docker image tag}"
container_name="renderscript_test"
log_file="${RENDERSCRIPT_TEST_LOG:-renderscript_test.log}"

cleanup() {
  docker rm -f "${container_name}" >/dev/null 2>&1 || true
}

capture_logs() {
  docker logs "${container_name}" > "${log_file}" 2>&1 || true
}

trap 'capture_logs; cleanup' EXIT

docker run -d --name "${container_name}" -p 3000:3000 "algolia/renderscript:${hash}"

attempts=30
until curl --output /dev/null --silent --fail http://localhost:3000/ready; do
  echo "waiting for docker..."
  sleep 1
  attempts=$((attempts - 1))
  if [[ "${attempts}" -eq 0 ]]; then
    echo "Timed out waiting for the docker image to become ready."
    capture_logs
    sed -n '1,200p' "${log_file}"
    exit 1
  fi
done

capture_logs
sed -n '1,120p' "${log_file}"

if grep -q '"svc":"brws","msg":"Ready"' "${log_file}"; then
  echo "Browser ready"
else
  echo "Browser not ready"
  exit 1
fi

curl --silent --show-error --fail --request POST \
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

capture_logs
sed -n '1,200p' "${log_file}"

if grep -q '"msg":"Done","data":' "${log_file}"; then
  echo "Rendered"
else
  echo "Not rendered"
  exit 1
fi

echo "Image OK"
