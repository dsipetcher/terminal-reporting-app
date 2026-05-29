@echo off
cd /d "%~dp0"
if not exist "terminal-reporting-app\prepare-portable.bat" (
    echo [ERROR] terminal-reporting-app folder not found
    pause
    exit /b 1
)
call terminal-reporting-app\prepare-portable.bat
