@echo off
REM Shared helpers for portable launchers (call from other .bat via: call "%~dp0scripts\lib.bat" :resolve_node)

:resolve_node
set "NODE_EXE="
if exist "%~dp0..\runtime\node\node.exe" set "NODE_EXE=%~dp0..\runtime\node\node.exe"
if not defined NODE_EXE if exist "%~dp0runtime\node\node.exe" set "NODE_EXE=%~dp0runtime\node\node.exe"
if not defined NODE_EXE (
    where node >nul 2>nul && set "NODE_EXE=node"
)
goto :eof

:npm_cli
REM Sets NPM_CLI to npm-cli.js path next to NODE_EXE
if /i "%NODE_EXE%"=="node" (
    for /f "delims=" %%i in ('where npm 2^>nul') do set "NPM_CMD=%%i" & goto :npm_done
)
set "NPM_CLI=%NODE_EXE:\node.exe=\node_modules\npm\bin\npm-cli.js%"
if not exist "%NPM_CLI%" set "NPM_CLI=%NODE_EXE:\node.exe=\npm.cmd%"
:npm_done
goto :eof
