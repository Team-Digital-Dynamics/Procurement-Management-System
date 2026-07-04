Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

param(
    [string]$ComposeFile = "$(Join-Path $PSScriptRoot '..\docker-compose.yml')",
    [string]$BackupDir = "$(Join-Path $PSScriptRoot '..\backups')",
    [string]$Database = 'pms',
    [string]$Username = 'pms',
    [string]$Password = 'pms',
    [int]$RetentionDays = 14
)

if (-not (Test-Path $ComposeFile)) {
    throw "docker-compose file not found: $ComposeFile"
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker CLI is not available in PATH.'
}

if (-not (Test-Path $BackupDir)) {
    New-Item -Path $BackupDir -ItemType Directory | Out-Null
}

$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupFile = Join-Path $BackupDir ("{0}_{1}.sql" -f $Database, $timestamp)
$checksumFile = "$backupFile.sha256"

Write-Host "Creating backup: $backupFile"

docker compose -f $ComposeFile exec -T mysql mysqldump -u$Username -p$Password --single-transaction --quick --routines --triggers --events $Database > $backupFile

if ($LASTEXITCODE -ne 0) {
    throw 'mysqldump failed. Confirm docker compose is running and credentials are correct.'
}

Get-FileHash -Path $backupFile -Algorithm SHA256 |
    ForEach-Object { "$($_.Hash)  $([System.IO.Path]::GetFileName($backupFile))" } |
    Set-Content -Path $checksumFile

Write-Host "Backup completed."
Write-Host "SQL: $backupFile"
Write-Host "SHA256: $checksumFile"

$cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $BackupDir -File |
    Where-Object { ($_.Extension -eq '.sql' -or $_.Name -like '*.sql.sha256') -and $_.LastWriteTime -lt $cutoff } |
    Remove-Item -Force

Write-Host "Retention cleanup done for files older than $RetentionDays day(s)."