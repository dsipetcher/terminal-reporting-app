#!/bin/bash
set -e
cd "$(dirname "$0")"
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js not found: https://nodejs.org/"
    exit 1
fi
if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    npm install
fi
npm start
