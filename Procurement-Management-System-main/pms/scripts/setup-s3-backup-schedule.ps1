Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

<#
.SYNOPSIS
    Setup automated daily backup to AWS S3
    
.DESCRIPTION
    Creates a Windows Task Scheduler job for daily MySQL backups to S3 bucket: pms-backups-dynamics
    
.EXAMPLE
    .\setup-s3-backup-schedule.ps1
#>

param(
    [string]$TaskName = 'PMS-Daily-Backup-S3',
    [string]$ScheduleTime = '01:00',
    [string]$S3Bucket = 'pms-backups-dynamics',
    [string]$BackupScript
)

if (-not $BackupScript) {
    $BackupScript = Join-Path (Split-Path $PSScriptRoot -Parent) 'pms\scripts\backup-mysql-s3.ps1'
}

# If still not found, try current directory
if (-not (Test-Path $BackupScript)) {
    $BackupScript = Join-Path (Get-Location) 'scripts\backup-mysql-s3.ps1'
}

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "S3 Daily Backup Scheduler Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Verify backup script exists
if (-not (Test-Path $BackupScript)) {
    Write-Host "ERROR: Backup script not found!" -ForegroundColor Red
    Write-Host "Expected location: $BackupScript" -ForegroundColor Red
    exit 1
}

$BackupScript = (Resolve-Path $BackupScript).Path
Write-Host "✅ Backup script found: $BackupScript" -ForegroundColor Green
Write-Host ""

# Check for existing task
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Scheduled task '$TaskName' already exists." -ForegroundColor Yellow
    Write-Host "Removing existing task..."
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false | Out-Null
    Write-Host "✅ Old task removed" -ForegroundColor Green
    Write-Host ""
}

# Create task
Write-Host "Creating scheduled task..." -ForegroundColor Yellow

$action = New-ScheduledTaskAction `
    -Execute 'powershell.exe' `
    -Argument "-ExecutionPolicy Bypass -NoProfile -File `"$BackupScript`""

$trigger = New-ScheduledTaskTrigger -Daily -At $ScheduleTime

$principal = New-ScheduledTaskPrincipal `
    -UserID 'NT AUTHORITY\SYSTEM' `
    -RunLevel Highest

$settings = New-ScheduledTaskSettingsSet `
    -MultipleInstances IgnoreNew `
    -StartWhenAvailable:$true `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 30) `
    -RunOnlyIfNetworkAvailable:$true

$description = "PMS Digital Dynamics - Daily MySQL backup to AWS S3 bucket: $S3Bucket"

$task = New-ScheduledTask `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Settings $settings `
    -Description $description

# Register task
try {
    Register-ScheduledTask -TaskName $TaskName -InputObject $task -Force | Out-Null
    Write-Host "✅ Scheduled task created successfully!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to create scheduled task" -ForegroundColor Red
    Write-Host "Details: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solution: Run PowerShell as Administrator" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Green
Write-Host "TASK CONFIGURATION COMPLETE" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

Write-Host "Task Details:" -ForegroundColor Cyan
Write-Host "  Name: $TaskName" -ForegroundColor Cyan
Write-Host "  Schedule: Daily at $ScheduleTime UTC" -ForegroundColor Cyan
Write-Host "  S3 Bucket: $S3Bucket" -ForegroundColor Cyan
Write-Host "  Run As: SYSTEM (elevated)" -ForegroundColor Cyan
Write-Host "  Max Duration: 30 minutes" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test backup manually:" -ForegroundColor Yellow
Write-Host "   powershell -ExecutionPolicy Bypass -File `"$BackupScript`"" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Verify backup in S3:" -ForegroundColor Yellow
Write-Host "   aws s3 ls s3://$S3Bucket/backups/ --recursive" -ForegroundColor Gray
Write-Host ""
Write-Host "3. View Task Scheduler:" -ForegroundColor Yellow
Write-Host "   taskschd.msc" -ForegroundColor Gray
Write-Host ""

Write-Host "Backups will run automatically every day at $ScheduleTime" -ForegroundColor Green
Write-Host "Backup files: s3://$S3Bucket/backups/YYYY/MM/DD/pms_TIMESTAMP.sql" -ForegroundColor Green
Write-Host ""
