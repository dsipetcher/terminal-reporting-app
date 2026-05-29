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

echo Stopping servers...
call "%~dp0stop.bat" >nul 2>nul

echo Removing broken node_modules...
if exist "%~dp0backend\node_modules" rmdir /s /q "%~dp0backend\node_modules"
if exist "%~dp0frontend\node_modules" rmdir /s /q "%~dp0frontend\node_modules"
if exist "%~dp0node_modules" rmdir /s /q "%~dp0node_modules"

set "PATH=%NODE_DIR%;%PATH%"
echo Installing dependencies...
if exist "%NODE_DIR%\npm.cmd" (
    call "%NODE_DIR%\npm.cmd" run install:all
) else (
    call npm run install:all
)
if errorlevel 1 goto fail

echo.
echo Verifying Prisma...
if exist "%NODE_DIR%\npm.cmd" (
    call "%NODE_DIR%\npm.cmd" run db:init --prefix backend
) else (
    call npm run db:init --prefix backend
)
if errorlevel 1 goto fail

echo.
echo Repair completed. Now run run.bat
echo.
pause
exit /b 0

:fail
echo.
echo [ERROR] Repair failed.
pause
exit /b 1
