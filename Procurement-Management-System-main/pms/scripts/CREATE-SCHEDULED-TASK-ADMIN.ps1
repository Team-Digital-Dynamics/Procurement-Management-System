# Create PMS Backup Scheduled Task - RUN AS ADMINISTRATOR

# Configuration
$TaskName = 'PMS-Daily-Backup-S3'
$ProjectPath = 'C:\Users\nonhlanhla.Sambo\Documents\TestingMain\Procurement-Management-System-main (4)\Procurement-Management-System-main'
$BackupScript = "$ProjectPath\pms\scripts\backup-daily-production.ps1"
$ScheduleTime = '01:00'

Write-Host "Creating PMS Daily Backup Task..."
Write-Host "Task Name: $TaskName"
Write-Host "Script: $BackupScript"

# Remove existing task if present
$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($ExistingTask) {
    Write-Host "Removing existing task..."
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# Create task action
$Action = New-ScheduledTaskAction `
    -Execute 'powershell.exe' `
    -Argument "-ExecutionPolicy Bypass -NoProfile -File `"$BackupScript`""

# Create daily trigger at 01:00
$Trigger = New-ScheduledTaskTrigger -Daily -At $ScheduleTime

# Create principal (run as SYSTEM)
$Principal = New-ScheduledTaskPrincipal `
    -UserID 'NT AUTHORITY\SYSTEM' `
    -RunLevel Highest

# Create settings
$Settings = New-ScheduledTaskSettingsSet `
    -MultipleInstances IgnoreNew `
    -StartWhenAvailable:$true `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 30) `
    -RunOnlyIfNetworkAvailable:$true

# Create the task
try {
    $Task = New-ScheduledTask `
        -Action $Action `
        -Trigger $Trigger `
        -Principal $Principal `
        -Settings $Settings `
        -Description 'PMS Digital Dynamics - Daily Backup to AWS S3'
    
    # Register the task
    Register-ScheduledTask -TaskName $TaskName -InputObject $Task -Force
    
    Write-Host ""
    Write-Host "SUCCESS! Task created: $TaskName"
    Write-Host "Status: Ready"
    Write-Host "Schedule: Daily at $ScheduleTime UTC"
    Write-Host ""
    Write-Host "Next backup will run: Tomorrow at $ScheduleTime UTC"
    
} catch {
    Write-Host ""
    Write-Host "ERROR: $_"
}

# Verify
Write-Host ""
Write-Host "Verifying task..."
Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue | Select TaskName, State
