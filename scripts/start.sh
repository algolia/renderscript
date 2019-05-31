#! /bin/sh

cleanup() {
  echo "start.sh: Gracefully exiting"

  # Kill the API first, then XVFB
  kill -TERM $api_pid
  wait $api_pid >/dev/null || true

  echo "start.sh: Gracefully exited node process"

  kill -TERM $xvfb_pid
  wait $xvfb_pid >/dev/null || true

  echo "start.sh: Gracefully exited xfvb"
}

trap cleanup INT
trap cleanup TERM

DISPLAY=:95

Xvfb $DISPLAY -screen 0 1920x1080x16 &
xvfb_pid=$!
DISPLAY="$DISPLAY" node dist/api/index.js &
api_pid=$!

wait $api_pid
wait $xvfb_pid
