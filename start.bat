@echo off
cd /d "%~dp0terminal-reporting-app"
if not exist "package.json" (
    echo [ERROR] Project not found in %~dp0terminal-reporting-app
    pause
    exit /b 1
)
call start.bat
