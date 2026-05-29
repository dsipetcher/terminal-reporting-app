# Downloads portable Node.js for Windows x64 into runtime/node
$ErrorActionPreference = 'Stop'
$NodeVersion = '20.18.0'
$Root = Split-Path -Parent $PSScriptRoot
$RuntimeDir = Join-Path $Root 'runtime\node'
$NodeExe = Join-Path $RuntimeDir 'node.exe'

if (Test-Path $NodeExe) {
    Write-Host "Portable Node.js already present: $NodeExe"
    exit 0
}

$ZipName = "node-v$NodeVersion-win-x64.zip"
$Url = "https://nodejs.org/dist/v$NodeVersion/$ZipName"
$TempZip = Join-Path $env:TEMP $ZipName
$ExtractDir = Join-Path $Root 'runtime\_node_extract'

Write-Host "Downloading Node.js v$NodeVersion ..."
Invoke-WebRequest -Uri $Url -OutFile $TempZip -UseBasicParsing

Write-Host "Extracting..."
if (Test-Path $ExtractDir) { Remove-Item $ExtractDir -Recurse -Force }
Expand-Archive -Path $TempZip -DestinationPath $ExtractDir -Force

$Inner = Join-Path $ExtractDir "node-v$NodeVersion-win-x64"
New-Item -ItemType Directory -Force -Path (Join-Path $Root 'runtime') | Out-Null
if (Test-Path $RuntimeDir) { Remove-Item $RuntimeDir -Recurse -Force }
Move-Item $Inner $RuntimeDir
Remove-Item $ExtractDir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $TempZip -Force -ErrorAction SilentlyContinue

Write-Host "Portable Node.js installed: $NodeExe"
