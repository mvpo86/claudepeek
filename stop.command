#!/bin/bash
cd "$(dirname "$0")"

PID_FILE=".server.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "Server is not running (no PID file found)."
  exit 0
fi

PID=$(cat "$PID_FILE")
if kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  rm "$PID_FILE"
  echo "Server stopped (PID $PID)."
else
  rm "$PID_FILE"
  echo "Server was not running (stale PID file cleaned up)."
fi
