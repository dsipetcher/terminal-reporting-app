@echo off
cd /d "%~dp0terminal-reporting-app"
if not exist "prepare-portable.bat" (
    echo [ERROR] Папка terminal-reporting-app не найдена
    pause
    exit /b 1
)
call prepare-portable.bat
