#!/bin/bash

echo "========================================"
echo "  Terminal Operating System - Launcher"
echo "========================================"
echo ""

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js not found! Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "[1/4] Checking dependencies..."

# Backend dependencies
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

# Frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Prisma setup
if [ ! -f "backend/dev.db" ]; then
    echo "[2/4] Setting up database..."
    cd backend
    npx prisma migrate dev --name init
    npx prisma generate
    cd ..
else
    echo "[2/4] Database already exists"
fi

echo "[3/4] Starting Backend API..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

sleep 5

echo "[4/4] Starting Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

sleep 5

echo ""
echo "========================================"
echo "  Terminal Operating System Started!"
echo "========================================"
echo ""
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo ""
echo "  Press Ctrl+C to stop all services"
echo "========================================"
echo ""

# Открыть браузер
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173
elif command -v open &> /dev/null; then
    open http://localhost:5173
fi

# Ожидание завершения
wait $BACKEND_PID $FRONTEND_PID
