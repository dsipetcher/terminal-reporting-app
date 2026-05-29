@echo off
REM Shared helpers for portable launchers

:resolve_node
set "REPO_ROOT=%~dp0..\.."
set "NODE_DIR=%REPO_ROOT%\runtime\node"
set "NODE_EXE="
if exist "%NODE_DIR%\node.exe" set "NODE_EXE=%NODE_DIR%\node.exe"
if not defined NODE_EXE if exist "%~dp0..\runtime\node\node.exe" (
    set "NODE_DIR=%~dp0..\runtime\node"
    set "NODE_EXE=%NODE_DIR%\node.exe"
)
if not defined NODE_EXE (
    where node >nul 2>nul && set "NODE_EXE=node"
)
goto :eof
