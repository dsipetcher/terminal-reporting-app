@echo off
chcp 65001 >nul
cd /d "%~dp0"
title ИЛС — угольно-нефтяной терминал

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] Node.js не найден: https://nodejs.org/
    echo Сначала установите Node.js LTS, затем запустите setup.bat
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo Зависимости не установлены. Запускаю setup.bat...
    call "%~dp0setup.bat"
    if %ERRORLEVEL% NEQ 0 exit /b 1
)

if not exist "backend\node_modules\" (
    echo Доустановка backend...
    call npm install --prefix backend
)
if not exist "frontend\node_modules\" (
    echo Доустановка frontend...
    call npm install --prefix frontend
)

if not exist "backend\prisma\dev.db" (
    echo База не найдена. Инициализация...
    call npm run db:init
    call npm run db:seed
) else (
    call npm run db:init >nul 2>nul
)

REM Освободить порты от предыдущего запуска
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>nul
)
timeout /t 1 /nobreak >nul

echo.
echo  ИЛС запускается...
echo  Backend:  http://localhost:3001
echo  Frontend: http://localhost:5173
echo  Логин:    admin / admin
echo.
echo  Закройте это окно для остановки серверов.
echo.

start "" cmd /c "timeout /t 6 /nobreak >nul && start http://localhost:5173/"

call npm start
