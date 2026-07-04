Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile,
    [string]$ComposeFile = "$(Join-Path $PSScriptRoot '..\docker-compose.yml')",
    [string]$Database = 'pms',
    [string]$AppUsername = 'pms',
    [string]$AppPassword = 'pms',
    [string]$RootPassword = 'Password1238',
    [switch]$CreateSafetyBackup
)

if (-not (Test-Path $ComposeFile)) {
    throw "docker-compose file not found: $ComposeFile"
}

if (-not (Test-Path $BackupFile)) {
    throw "Backup file not found: $BackupFile"
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker CLI is not available in PATH.'
}

if ($CreateSafetyBackup) {
    $backupScript = Join-Path $PSScriptRoot 'backup-mysql.ps1'
    if (-not (Test-Path $backupScript)) {
        throw "Safety backup script not found: $backupScript"
    }
    & $backupScript -ComposeFile $ComposeFile -Database $Database -Username $AppUsername -Password $AppPassword
}

Write-Host "Dropping and recreating database '$Database'..."

docker compose -f $ComposeFile exec -T mysql mysql -uroot -p$RootPassword -e "DROP DATABASE IF EXISTS $Database; CREATE DATABASE $Database; GRANT ALL PRIVILEGES ON $Database.* TO '$AppUsername'@'%'; FLUSH PRIVILEGES;"

if ($LASTEXITCODE -ne 0) {
    throw 'Failed to recreate database. Check root password and MySQL container health.'
}

Write-Host "Restoring from backup: $BackupFile"

Get-Content -Path $BackupFile -Raw | docker compose -f $ComposeFile exec -T mysql mysql -u$AppUsername -p$AppPassword $Database

if ($LASTEXITCODE -ne 0) {
    throw 'Restore failed while importing SQL dump.'
}

Write-Host 'Restore completed successfully.'