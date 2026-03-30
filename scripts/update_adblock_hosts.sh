#!/bin/sh

# adblock hosts file URL (1Hosts Lite, adblock filter syntax)
URL="https://raw.githubusercontent.com/badmojr/1Hosts/refs/heads/master/Lite/adblock.txt"

TARGET_DIR="./dist/lib/browser"
TARGET_FILE="adblock_hosts.txt"

mkdir -p "${TARGET_DIR}"

if curl -o "${TARGET_DIR}/${TARGET_FILE}" "$URL" -s; then
  echo "✅ adblock hosts download successful."
else
  echo "❌ adblock hosts download failed."
  exit 1
fi
