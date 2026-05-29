#!/bin/bash
set -e
cd "$(dirname "$0")"

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js not found: https://nodejs.org/"
    exit 1
fi

if [ ! -d "node_modules" ] || [ ! -d "backend/node_modules" ]; then
    echo "Зависимости не установлены. Запустите ./setup.sh"
    exit 1
fi

if [ ! -f "backend/prisma/dev.db" ]; then
    echo "Инициализация базы..."
    npm run db:init
    npm run db:seed
else
    npm run db:init >/dev/null 2>&1 || true
fi

echo ""
echo " ИЛС: http://localhost:5173"
echo " Логин: admin / admin"
echo ""

npm start
