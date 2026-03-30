#!/usr/bin/env bash

set -euo pipefail

# adblock hosts file URL (1Hosts Lite, adblock filter syntax)
URL="https://raw.githubusercontent.com/badmojr/1Hosts/refs/heads/master/Lite/adblock.txt"

SOURCE_SNAPSHOT="./src/lib/browser/adblock_hosts.txt"
TARGET_DIR="./dist/lib/browser"
TARGET_FILE="adblock_hosts.txt"
TARGET_PATH="${TARGET_DIR}/${TARGET_FILE}"
TMP_PATH="${TARGET_PATH}.tmp"

mkdir -p "${TARGET_DIR}"
cp "${SOURCE_SNAPSHOT}" "${TARGET_PATH}"

echo "Seeded adblock hosts from repo snapshot."

if curl \
  --fail \
  --silent \
  --show-error \
  --location \
  --retry 5 \
  --retry-all-errors \
  --retry-delay 2 \
  --connect-timeout 10 \
  --max-time 120 \
  -o "${TMP_PATH}" \
  "${URL}"; then
  if [ -s "${TMP_PATH}" ]; then
    mv "${TMP_PATH}" "${TARGET_PATH}"
    echo "Refreshed adblock hosts from upstream."
  else
    rm -f "${TMP_PATH}"
    echo "Downloaded adblock hosts file was empty, keeping repo snapshot."
  fi
else
  rm -f "${TMP_PATH}"
  echo "Warning: adblock hosts download failed, keeping repo snapshot."
  if [ "${REQUIRE_ADBLOCK_UPDATE:-false}" = "true" ]; then
    exit 1
  fi
fi
