@echo off
cd /d "%~dp0"
title Install portable Node.js
echo.
echo Installing portable Node.js into runtime/node ...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\ensure-node.ps1"
if errorlevel 1 (
    echo [ERROR] Install failed.
    pause
    exit /b 1
)
echo.
echo Done: %~dp0runtime\node\node.exe
pause
