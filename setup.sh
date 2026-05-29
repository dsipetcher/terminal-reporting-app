#!/bin/bash
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/terminal-reporting-app"
exec ./setup.sh
