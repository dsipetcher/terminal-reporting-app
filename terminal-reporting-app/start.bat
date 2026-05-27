@echo off
echo ========================================
echo   Terminal Operating System - Launcher
echo ========================================
echo.

REM Проверка Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found! Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Checking dependencies...

REM Backend dependencies
if not exist "backend\node_modules\" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

REM Frontend dependencies
if not exist "frontend\node_modules\" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

REM Prisma setup
echo [2/4] Setting up database...
cd backend
call npx prisma db push
call npx prisma generate
call npm run prisma:seed
cd ..

echo [3/4] Starting Backend API...
cd backend
start "TOS Backend" cmd /k "npm run dev"
cd ..

timeout /t 5 /nobreak >nul

echo [4/4] Starting Frontend...
cd frontend
start "TOS Frontend" cmd /k "npm run dev"
cd ..

timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   Terminal Operating System Started!
echo ========================================
echo.
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3001
echo.
echo   Press Ctrl+C in each window to stop
echo ========================================
echo.

REM Открыть браузер
start http://localhost:5173

echo Application is running...
echo Close this window when done.
pause >nul
