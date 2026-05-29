@echo off
cd /d "%~dp0"
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found: https://nodejs.org/
    pause
    exit /b 1
)
if not exist "node_modules\" (
    echo Installing root dependencies...
    call npm install
)

REM Release Prisma query engine lock if a previous dev server is still running
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>nul
)
timeout /t 2 /nobreak >nul

call npm start
