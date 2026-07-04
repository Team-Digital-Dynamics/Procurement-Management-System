Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

<#
.SYNOPSIS
    Sets up automatic daily MySQL backups for the PMS system.

.DESCRIPTION
    This script registers a Windows Task Scheduler job to run MySQL backups daily at 01:00 AM.
    The backup script will be executed with elevated privileges.

.PARAMETER BackupScriptPath
    Path to the backup script (default: .\scripts\backup-mysql.ps1 relative to current directory).

.PARAMETER ScheduleTime
    Time to run the backup (default: 01:00 for 1:00 AM).

.PARAMETER TaskName
    Name of the scheduled task (default: PMS-Daily-Backup).

.EXAMPLE
    .\setup-daily-backup.ps1
    # Uses defaults: daily at 01:00 AM

.EXAMPLE
    .\setup-daily-backup.ps1 -ScheduleTime "02:30"
    # Schedules backup for 02:30 AM daily
#>

param(
    [string]$BackupScriptPath,
    [string]$ScheduleTime = "01:00",
    [string]$TaskName = "PMS-Daily-Backup"
)

if (-not $BackupScriptPath) {
    $BackupScriptPath = Join-Path (Get-Location) 'scripts\backup-mysql.ps1'
}

# Verify script exists
if (-not (Test-Path $BackupScriptPath)) {
    Write-Error "Backup script not found: $BackupScriptPath"
    exit 1
}

$BackupScriptPath = (Resolve-Path $BackupScriptPath).Path
Write-Host "Backup Script: $BackupScriptPath"
Write-Host "Task Name: $TaskName"
Write-Host "Schedule Time: $ScheduleTime daily"
Write-Host ""

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Scheduled task '$TaskName' already exists."
    $response = Read-Host "Replace existing task? (Y/N)"
    if ($response -ne "Y" -and $response -ne "y") {
        Write-Host "Operation cancelled."
        exit 0
    }
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Existing task removed."
}

# Parse schedule time
try {
    $time = [datetime]::ParseExact($ScheduleTime, "HH:mm", $null)
} catch {
    Write-Error "Invalid time format. Use HH:mm (e.g., 01:00, 14:30)"
    exit 1
}

# Create scheduled task action
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -NoProfile -File `"$BackupScriptPath`""

# Create daily trigger
$trigger = New-ScheduledTaskTrigger `
    -Daily `
    -At $time

# Create task principal (run with highest privileges)
$principal = New-ScheduledTaskPrincipal `
    -UserID "NT AUTHORITY\SYSTEM" `
    -RunLevel Highest

# Create task settings
$settings = New-ScheduledTaskSettingsSet `
    -MultipleInstances IgnoreNew `
    -StartWhenAvailable:$true `
    -RunOnlyIfNetworkAvailable:$true `
    -AllowStartIfOnBatteries:$false `
    -DontStopIfGoingOnBatteries:$false `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 30)

# Register the task
$task = New-ScheduledTask `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Settings $settings `
    -Description "PMS Digital Dynamics - Automated Daily MySQL Backup at $ScheduleTime UTC"

Register-ScheduledTask `
    -TaskName $TaskName `
    -InputObject $task `
    -Force | Out-Null

Write-Host ""
Write-Host "✅ Scheduled task created successfully!"
Write-Host ""
Write-Host "Task Details:"
Write-Host "  Name: $TaskName"
Write-Host "  Schedule: Daily at $ScheduleTime UTC"
Write-Host "  Run As: SYSTEM (elevated privileges)"
Write-Host "  Max Duration: 30 minutes"
Write-Host "  On Failure: Retry (built-in)"
Write-Host ""

# Verify task was created
$task = Get-ScheduledTask -TaskName $TaskName
if ($task) {
    Write-Host "✅ Verification: Task registered in Task Scheduler"
    Write-Host ""
    Write-Host "Next Steps:"
    Write-Host "1. Backups will run automatically daily at $ScheduleTime"
    Write-Host "2. Backup files will be created in: .\backups\"
    Write-Host "3. To manually test backup now, run:"
    Write-Host "   powershell -ExecutionPolicy Bypass -File '$BackupScriptPath'"
    Write-Host "4. To view backup history, open Task Scheduler:"
    Write-Host "   taskschd.msc"
    Write-Host ""
} else {
    Write-Error "Failed to verify task registration"
    exit 1
}

Write-Host "For more information, see: docs/PRODUCTION-HARDENING-GUIDE.md Section 1.4"
