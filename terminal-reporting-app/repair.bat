@echo off
chcp 65001 >nul
cd /d "%~dp0"
title ILS - repair dependencies

set "REPO_ROOT=%~dp0.."
set "NODE_DIR=%REPO_ROOT%\runtime\node"

echo.
echo  ========================================
echo   ILS - clean reinstall of dependencies
echo  ========================================
echo.

if exist "%NODE_DIR%\node.exe" (
    set "NODE_EXE=%NODE_DIR%\node.exe"
) else (
    where node >nul 2>nul && set "NODE_EXE=node"
)
if not defined NODE_EXE (
    echo [ERROR] Node.js not found. Run install-node.bat first.
    pause
    exit /b 1
)

echo Stopping servers and Node processes...
call "%~dp0stop.bat" >nul 2>nul
taskkill /F /IM node.exe >nul 2>nul
timeout /t 2 /nobreak >nul

echo Removing node_modules...
powershell -NoProfile -Command "foreach ($d in @('node_modules','backend/node_modules','frontend/node_modules')) { $p = Join-Path (Get-Location) $d; if (Test-Path $p) { Remove-Item -LiteralPath $p -Recurse -Force -ErrorAction SilentlyContinue } }"

if exist "%~dp0backend\node_modules\terminal-reporting-app" (
    echo Removing broken symlink backend/node_modules/terminal-reporting-app ...
    powershell -NoProfile -Command "Remove-Item -LiteralPath 'backend/node_modules/terminal-reporting-app' -Recurse -Force -ErrorAction SilentlyContinue"
)

set "PATH=%NODE_DIR%;%PATH%"
echo Installing root dependencies...
if exist "%NODE_DIR%\npm.cmd" (
    call "%NODE_DIR%\npm.cmd" install
) else (
    call npm install
)
if errorlevel 1 goto fail

echo Installing backend dependencies...
cd /d "%~dp0backend"
if exist "%NODE_DIR%\npm.cmd" (
    call "%NODE_DIR%\npm.cmd" install
) else (
    call npm install
)
if errorlevel 1 goto fail

echo Installing frontend dependencies...
cd /d "%~dp0frontend"
if exist "%NODE_DIR%\npm.cmd" (
    call "%NODE_DIR%\npm.cmd" install
) else (
    call npm install
)
if errorlevel 1 goto fail

cd /d "%~dp0"
echo.
echo Verifying Prisma, users and demo data...
if exist "%NODE_DIR%\npm.cmd" (
    call "%NODE_DIR%\npm.cmd" run db:init
    call "%NODE_DIR%\npm.cmd" run db:ensure-users
    call "%NODE_DIR%\npm.cmd" run db:ensure-data
) else (
    call npm run db:init
    call npm run db:ensure-users
    call npm run db:ensure-data
)
if errorlevel 1 goto fail

echo.
echo Repair completed. Now run run.bat
echo.
pause
exit /b 0

:fail
cd /d "%~dp0"
echo.
echo [ERROR] Repair failed.
pause
exit /b 1
