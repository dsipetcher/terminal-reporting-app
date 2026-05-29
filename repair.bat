@echo off
cd /d "%~dp0terminal-reporting-app"
if not exist "repair.bat" (
    echo [ERROR] terminal-reporting-app folder not found
    pause
    exit /b 1
)
call repair.bat
