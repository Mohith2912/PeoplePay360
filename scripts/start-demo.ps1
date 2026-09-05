$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$mysqlRoot = Join-Path $repoRoot '.local-runtime\mysql\mysql-8.4.11-winx64'
$mysqlExe = Join-Path $mysqlRoot 'bin\mysqld.exe'
$dataDir = Join-Path $repoRoot '.local-runtime\mysql-data'
$backendDir = Join-Path $repoRoot 'Backend'
$frontendDir = Join-Path $repoRoot 'Frontend'

if (-not (Test-Path -LiteralPath $mysqlExe)) { throw 'Local MySQL runtime is missing. See INTEGRATION.md.' }
if (-not (Test-Path -LiteralPath (Join-Path $backendDir '.env'))) { throw 'Backend/.env is missing. See INTEGRATION.md.' }

if (-not (Test-NetConnection 127.0.0.1 -Port 3307 -InformationLevel Quiet -WarningAction SilentlyContinue)) {
  Start-Process -FilePath $mysqlExe -ArgumentList @("--basedir=$mysqlRoot", "--datadir=$dataDir", '--port=3307', '--bind-address=127.0.0.1') -WorkingDirectory $mysqlRoot -WindowStyle Hidden
}
if (-not (Test-NetConnection 127.0.0.1 -Port 4000 -InformationLevel Quiet -WarningAction SilentlyContinue)) {
  Start-Process -FilePath 'C:\Program Files\nodejs\npm.cmd' -ArgumentList @('run','dev') -WorkingDirectory $backendDir -WindowStyle Hidden
}
if (-not (Test-NetConnection 127.0.0.1 -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue)) {
  Start-Process -FilePath 'C:\Program Files\nodejs\npm.cmd' -ArgumentList @('run','dev') -WorkingDirectory $frontendDir -WindowStyle Hidden
}

Write-Host 'PeoplePay360 is starting. Open http://localhost:3000'
