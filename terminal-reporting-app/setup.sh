#!/bin/bash
set -e
cd "$(dirname "$0")"

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js not found: https://nodejs.org/"
    exit 1
fi

echo "=== ИЛС — установка ==="
npm run setup
echo "Готово. Запустите ./start.sh"
