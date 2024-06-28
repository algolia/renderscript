#!/bin/sh

# adblock hosts file URL
URL="https://raw.githubusercontent.com/badmojr/1Hosts/master/Pro/domains.txt"

TARGET_DIR="./dist/lib/browser"
TARGET_FILE="adblock_hosts.txt"

if curl -o "${TARGET_DIR}/${TARGET_FILE}" "$URL" -s; then
  echo "✅ adblock hosts download successful."
else
  echo "❌ adblock hosts download failed."
  exit 1
fi