@echo off
chcp 65001 >nul
cd /d "%~dp0"
title ILS portable setup

set "REPO_ROOT=%~dp0.."
set "NODE_DIR=%REPO_ROOT%\runtime\node"

echo.
echo  ==============================================
echo   Portable setup - run once before copying to USB
echo  ==============================================
echo.

echo [1/4] Portable Node.js into repo root runtime/node ...
powershell -NoProfile -ExecutionPolicy Bypass -File "%REPO_ROOT%\scripts\ensure-node.ps1"
if errorlevel 1 goto fail

set "PATH=%NODE_DIR%;%PATH%"

echo [2/4] npm dependencies...
call "%NODE_DIR%\npm.cmd" run install:all
if errorlevel 1 goto fail

echo [3/4] SQLite database and demo data...
call "%~dp0stop.bat" >nul 2>nul
call "%NODE_DIR%\npm.cmd" run db:setup
if errorlevel 1 goto fail

echo [4/4] Frontend build...
call "%NODE_DIR%\npm.cmd" run build:portable
if errorlevel 1 goto fail

echo.
echo  Done. Copy the whole repo folder to USB drive.
echo  runtime/node is at repo root - Node.js install is not required on target PC.
echo  On another PC run run.bat from repo root or terminal-reporting-app folder.
echo.
pause
exit /b 0

:fail
echo.
echo [ERROR] Setup failed.
pause
exit /b 1
