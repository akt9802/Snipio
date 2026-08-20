#!/bin/sh
# Usage: docker-entrypoint.sh [web|socket|all]
#   web    — Next.js standalone (PORT, default 3002)
#   socket — Socket.IO room server (SOCKET_PORT, default 3003)
#   all    — both processes in one container
set -eu

mode="${1:-all}"

start_web() {
  echo "[snipio] starting Next.js on port ${PORT:-3002}"
  exec node server.js
}

start_socket() {
  echo "[snipio] starting Socket.IO on port ${SOCKET_PORT:-3003}"
  exec node socketServer.js
}

start_all() {
  echo "[snipio] starting Next.js (PORT=${PORT:-3002}) + Socket.IO (SOCKET_PORT=${SOCKET_PORT:-3003})"
  node server.js &
  web_pid=$!
  node socketServer.js &
  socket_pid=$!

  term() {
    kill -TERM "$web_pid" "$socket_pid" 2>/dev/null || true
    wait "$web_pid" "$socket_pid" 2>/dev/null || true
  }
  trap term INT TERM

  # Alpine ash has no `wait -n`. Poll until one child exits.
  while kill -0 "$web_pid" 2>/dev/null && kill -0 "$socket_pid" 2>/dev/null; do
    sleep 1
  done

  echo "[snipio] a process exited — shutting down the other"
  term
  exit 1
}

case "$mode" in
  web) start_web ;;
  socket) start_socket ;;
  all) start_all ;;
  *)
    echo "Unknown mode: $mode (expected web | socket | all)" >&2
    exit 1
    ;;
esac
