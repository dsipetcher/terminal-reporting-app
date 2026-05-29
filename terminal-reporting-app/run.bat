@echo off
chcp 65001 >nul
cd /d "%~dp0"
title ILS - run

set "REPO_ROOT=%~dp0.."
set "NODE_DIR=%REPO_ROOT%\runtime\node"

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
if exist "%NODE_DIR%\node.exe" set "NODE_EXE=%NODE_DIR%\node.exe"
if not defined NODE_EXE if exist "%~dp0runtime\node\node.exe" (
    set "NODE_DIR=%~dp0runtime\node"
    set "NODE_EXE=%NODE_DIR%\node.exe"
)
if not defined NODE_EXE where node >nul 2>nul && set "NODE_EXE=node"
if defined NODE_EXE goto :eof
echo [1/5] Downloading portable Node.js - internet required once...
powershell -NoProfile -ExecutionPolicy Bypass -File "%REPO_ROOT%\scripts\ensure-node.ps1"
if exist "%NODE_DIR%\node.exe" (
    set "NODE_EXE=%NODE_DIR%\node.exe"
    goto :eof
)
echo [ERROR] Node.js unavailable. Run install-node.bat or prepare-portable.bat
exit /b 1

:ensure_deps
call :deps_ok
if not errorlevel 1 goto :eof
echo [2/5] Installing dependencies...
call "%~dp0stop.bat" >nul 2>nul
if exist "%~dp0backend\node_modules\terminal-reporting-app" (
    echo Removing broken symlink backend/node_modules/terminal-reporting-app ...
    rmdir /s /q "%~dp0backend\node_modules" 2>nul
)
if exist "%~dp0frontend\node_modules\terminal-reporting-app" (
    echo Removing broken symlink frontend/node_modules/terminal-reporting-app ...
    rmdir /s /q "%~dp0frontend\node_modules" 2>nul
)
set "PATH=%NODE_DIR%;%PATH%"
if exist "%NODE_DIR%\npm.cmd" (
    call "%NODE_DIR%\npm.cmd" run install:all
) else (
    call npm run install:all
)
if errorlevel 1 (
    echo [WARN] npm install failed, retrying with clean node_modules...
    rmdir /s /q "%~dp0backend\node_modules" 2>nul
    rmdir /s /q "%~dp0frontend\node_modules" 2>nul
    rmdir /s /q "%~dp0node_modules" 2>nul
    if exist "%NODE_DIR%\npm.cmd" (
        call "%NODE_DIR%\npm.cmd" run install:all
    ) else (
        call npm run install:all
    )
)
if errorlevel 1 (
    echo [ERROR] npm install failed. Run repair.bat
    exit /b 1
)
call :deps_ok
if errorlevel 1 (
    echo [ERROR] Dependencies still broken. Run repair.bat
    exit /b 1
)
goto :eof

:deps_ok
if exist "%~dp0backend\node_modules\terminal-reporting-app" exit /b 1
if not exist "%~dp0backend\node_modules\tsx\package.json" exit /b 1
if not exist "%~dp0backend\node_modules\prisma\package.json" exit /b 1
if not exist "%~dp0backend\node_modules\@prisma\client\package.json" exit /b 1
if not exist "%~dp0frontend\node_modules\vite\package.json" exit /b 1
exit /b 0

:ensure_database
set "NEED_FULL_SEED=0"
if not exist "%~dp0backend\prisma\dev.db" set "NEED_FULL_SEED=1"
call :run_db_init
if errorlevel 1 exit /b 1
call :run_db_ensure_users
if errorlevel 1 exit /b 1
if "%NEED_FULL_SEED%"=="1" (
    echo [3/5] Creating database demo data...
    call :run_db_seed
    if errorlevel 1 exit /b 1
)
goto :eof

:ensure_frontend
if exist "%~dp0frontend\dist\index.html" goto :eof
echo [4/5] Building frontend...
set "PATH=%NODE_DIR%;%PATH%"
if exist "%NODE_DIR%\npm.cmd" (
    call "%NODE_DIR%\npm.cmd" run build:portable
) else (
    call npm run build:portable
)
if errorlevel 1 exit /b 1
goto :eof

:run_db_init
set "PATH=%NODE_DIR%;%PATH%"
if exist "%NODE_DIR%\npm.cmd" (
    call "%NODE_DIR%\npm.cmd" run db:init >nul 2>nul
) else (
    call npm run db:init >nul 2>nul
)
goto :eof

:run_db_setup
set "PATH=%NODE_DIR%;%PATH%"
if exist "%NODE_DIR%\npm.cmd" (
    call "%NODE_DIR%\npm.cmd" run db:setup
) else (
    call npm run db:setup
)
goto :eof

:run_db_ensure_users
set "PATH=%NODE_DIR%;%PATH%"
if exist "%NODE_DIR%\npm.cmd" (
    call "%NODE_DIR%\npm.cmd" run db:ensure-users
) else (
    call npm run db:ensure-users
)
goto :eof

:run_db_seed
set "PATH=%NODE_DIR%;%PATH%"
if exist "%NODE_DIR%\npm.cmd" (
    call "%NODE_DIR%\npm.cmd" run db:seed
) else (
    call npm run db:seed
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
