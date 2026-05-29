# Deprecated: use repo root script instead
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
& (Join-Path $Root 'scripts\ensure-node.ps1')
