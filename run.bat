@echo off
cd /d "%~dp0terminal-reporting-app"
if not exist "run.bat" (
    echo [ERROR] terminal-reporting-app folder not found
    pause
    exit /b 1
)
call run.bat
