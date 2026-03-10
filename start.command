#!/bin/bash
cd "$(dirname "$0")"

PID_FILE=".server.pid"
PORT=3737

if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    echo "Server is already running (PID $PID) at http://localhost:$PORT"
    open "http://localhost:$PORT"
    exit 0
  else
    rm "$PID_FILE"
  fi
fi

echo "Starting claudestats..."
node server.js &
echo $! > "$PID_FILE"

# Wait for server to be ready
for i in $(seq 1 10); do
  if curl -s "http://localhost:$PORT" > /dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

echo "Running at http://localhost:$PORT (PID $(cat $PID_FILE))"
echo "Run stop.command to shut it down."
open "http://localhost:$PORT"
