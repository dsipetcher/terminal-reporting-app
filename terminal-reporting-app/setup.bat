@echo off
chcp 65001 >nul
cd /d "%~dp0"
title ИЛС — первичная настройка

echo.
echo  ========================================
echo   ИЛС — установка зависимостей и базы
echo  ========================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] Node.js не найден.
    echo Установите LTS с https://nodejs.org/ и запустите setup.bat снова.
    echo.
    pause
    exit /b 1
)

for /f "tokens=1 delims=v" %%a in ('node -v') do set NODE_VER=%%a
echo Node.js v%NODE_VER%
echo.

echo [1/3] Установка npm-зависимостей...
call npm run install:all
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] Не удалось установить зависимости.
    pause
    exit /b 1
)

echo.
echo [2/3] Инициализация базы SQLite...
call npm run db:init
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] Не удалось инициализировать базу.
    pause
    exit /b 1
)

echo.
echo [3/3] Заполнение демо-данными...
call npm run db:seed
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] Не удалось заполнить базу.
    pause
    exit /b 1
)

echo.
echo  Готово. Запускайте start.bat
echo.
pause
