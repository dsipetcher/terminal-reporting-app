@echo off
chcp 65001 >nul
cd /d "%~dp0"
title ILS - run

echo.
echo  ========================================
echo   ILS terminal reporting
echo  ========================================
echo.

call :resolve_node
if errorlevel 1 goto fail

call :ensure_deps
if errorlevel 1 goto fail

call :ensure_database
if errorlevel 1 goto fail

call :ensure_frontend
if errorlevel 1 goto fail

call :free_port 3001

echo.
echo  Open: http://localhost:3001
echo  Login: admin / admin
echo  Close this window to stop the server.
echo.

start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3001/"

cd /d "%~dp0backend"
set SERVE_FRONTEND=1
set PORT=3001
set HOST=127.0.0.1
"%NODE_EXE%" "%~dp0backend\node_modules\tsx\dist\cli.mjs" src\index.ts
exit /b 0

:resolve_node
set "NODE_EXE="
if exist "%~dp0runtime\node\node.exe" set "NODE_EXE=%~dp0runtime\node\node.exe"
if not defined NODE_EXE where node >nul 2>nul && set "NODE_EXE=node"
if defined NODE_EXE goto :eof
echo [1/5] Downloading portable Node.js - internet required once...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\ensure-node.ps1"
if exist "%~dp0runtime\node\node.exe" (
    set "NODE_EXE=%~dp0runtime\node\node.exe"
    goto :eof
)
echo [ERROR] Node.js unavailable. Run prepare-portable.bat first.
exit /b 1

:ensure_deps
if exist "%~dp0backend\node_modules\tsx" if exist "%~dp0frontend\node_modules\vite" goto :eof
echo [2/5] Installing dependencies...
set "PATH=%~dp0runtime\node;%PATH%"
if exist "%~dp0runtime\node\npm.cmd" (
    call "%~dp0runtime\node\npm.cmd" run install:all
) else (
    call npm run install:all
)
if errorlevel 1 exit /b 1
goto :eof

:ensure_database
if exist "%~dp0backend\prisma\dev.db" (
    call :run_db_init
    goto :eof
)
echo [3/5] Creating database and demo data...
call :run_db_setup
if errorlevel 1 exit /b 1
goto :eof

:ensure_frontend
if exist "%~dp0frontend\dist\index.html" goto :eof
echo [4/5] Building frontend...
set "PATH=%~dp0runtime\node;%PATH%"
if exist "%~dp0runtime\node\npm.cmd" (
    call "%~dp0runtime\node\npm.cmd" run build:portable
) else (
    call npm run build:portable
)
if errorlevel 1 exit /b 1
goto :eof

:run_db_init
set "PATH=%~dp0runtime\node;%PATH%"
if exist "%~dp0runtime\node\npm.cmd" (
    call "%~dp0runtime\node\npm.cmd" run db:init >nul 2>nul
) else (
    call npm run db:init >nul 2>nul
)
goto :eof

:run_db_setup
set "PATH=%~dp0runtime\node;%PATH%"
if exist "%~dp0runtime\node\npm.cmd" (
    call "%~dp0runtime\node\npm.cmd" run db:setup
) else (
    call npm run db:setup
)
goto :eof

:free_port
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%1 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>nul
)
goto :eof

:fail
echo.
pause
exit /b 1
