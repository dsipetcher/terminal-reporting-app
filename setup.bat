@echo off
cd /d "%~dp0terminal-reporting-app"
if not exist "package.json" (
    echo [ERROR] Папка terminal-reporting-app не найдена
    pause
    exit /b 1
)
call setup.bat
