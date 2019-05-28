#! /bin/sh

set -e

cleanup() {
  # Kill the API first, then XVFB
  kill -TERM $api_pid
  wait $api_pid >/dev/null || true

  kill -TERM $xvfb_pid
  wait $xvfb_pid >/dev/null || true
}

trap cleanup INT
trap cleanup TERM

DISPLAY=:95

Xvfb $DISPLAY -screen 0 1920x1080x16 &
xvfb_pid=$!
DISPLAY="$DISPLAY" node dist/api/index.js &
api_pid=$!

# Endless until killed
while true; do
  sleep 1
  # Allows to catch signals before sleep has completed
  wait $!
done
