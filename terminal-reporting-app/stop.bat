@echo off
chcp 65001 >nul
echo Остановка серверов ИЛС - порты 3001, 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>nul
)
echo Готово.
timeout /t 2 /nobreak >nul
