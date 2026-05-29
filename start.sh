#!/bin/bash
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/terminal-reporting-app"
if [ ! -f package.json ]; then
  echo "[ERROR] Project not found in $ROOT/terminal-reporting-app"
  exit 1
fi
./start.sh
