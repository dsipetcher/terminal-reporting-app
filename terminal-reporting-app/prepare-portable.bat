@echo off
chcp 65001 >nul
cd /d "%~dp0"
title ILS portable setup

echo.
echo  ==============================================
echo   Portable setup - run once before copying to USB
echo  ==============================================
echo.

echo [1/4] Portable Node.js...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\ensure-node.ps1"
if errorlevel 1 goto fail

set "PATH=%~dp0runtime\node;%PATH%"

echo [2/4] npm dependencies...
call "%~dp0runtime\node\npm.cmd" run install:all
if errorlevel 1 goto fail

echo [3/4] SQLite database and demo data...
call "%~dp0stop.bat" >nul 2>nul
call "%~dp0runtime\node\npm.cmd" run db:setup
if errorlevel 1 goto fail

echo [4/4] Frontend build...
call "%~dp0runtime\node\npm.cmd" run build:portable
if errorlevel 1 goto fail

echo.
echo  Done. Copy terminal-reporting-app folder to USB drive.
echo  On another PC run run.bat - Node.js install is not required.
echo.
pause
exit /b 0

:fail
echo.
echo [ERROR] Setup failed.
pause
exit /b 1
