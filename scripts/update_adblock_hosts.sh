#!/bin/sh

# adblock hosts file URL
URL="https://raw.githubusercontent.com/badmojr/1Hosts/master/Pro/domains.txt"

TARGET_DIR="./src/lib/browser"
DIST_DIR="./dist/lib/browser"
TARGET_FILE="adblock_hosts.txt"

# check if the target and dist directory exists
# should always be true, but just in case
if [ ! -d "$TARGET_DIR" ] || [ ! -d "$DIST_DIR" ]; then
  echo "❌ target or dist directory does not exist."
  exit 1
fi

# download the adblock hosts file
if curl -o "${TARGET_DIR}/${TARGET_FILE}" "$URL" -s && cp "${TARGET_DIR}/${TARGET_FILE}" "${DIST_DIR}/${TARGET_FILE}"; then
  echo "✅ adblock hosts download successful."
else
  echo "❌ adblock hosts download failed."
  exit 1
fi