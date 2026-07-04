$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "PMS Daily S3 Backup - Admin Setup" -ForegroundColor Cyan
Write-Host ""

$IsAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] 'Administrator')
if (-not $IsAdmin) {
    Write-Host "ERROR: Must run as Administrator!" -ForegroundColor Red
    exit 1
}

Write-Host "OK - Running as Administrator" -ForegroundColor Green
Write-Host ""

$TaskName = 'PMS-Daily-Backup-S3'
$BackupScript = 'C:\Users\nonhlanhla.Sambo\Documents\TestingMain\Procurement-Management-System-main (4)\Procurement-Management-System-main\pms\scripts\backup-mysql-s3-auto.ps1'
$ScheduleTime = '01:00'

if (-not (Test-Path $BackupScript)) {
    Write-Host "ERROR: Backup script not found!" -ForegroundColor Red
    exit 1
}

Write-Host "OK - Backup script found" -ForegroundColor Green
Write-Host ""
Write-Host "Creating scheduled task..." -ForegroundColor Yellow

$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($ExistingTask) {
    Write-Host "Removing old task..." -ForegroundColor Gray
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue | Out-Null
}

$Action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-ExecutionPolicy Bypass -NoProfile -File `"$BackupScript`""
$Trigger = New-ScheduledTaskTrigger -Daily -At $ScheduleTime
$Principal = New-ScheduledTaskPrincipal -UserID 'NT AUTHORITY\SYSTEM' -RunLevel Highest
$Settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -StartWhenAvailable:$true -ExecutionTimeLimit (New-TimeSpan -Minutes 30) -RunOnlyIfNetworkAvailable:$true
$Task = New-ScheduledTask -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -Description 'PMS Daily MySQL Backup to AWS S3'

Register-ScheduledTask -TaskName $TaskName -InputObject $Task -Force | Out-Null

Write-Host ""
Write-Host "SUCCESS! Daily S3 Backups Scheduled" -ForegroundColor Green
Write-Host ""
Write-Host "Task: $TaskName" -ForegroundColor Cyan
Write-Host "Time: Daily at $ScheduleTime UTC" -ForegroundColor Cyan
Write-Host "Destination: s3://pms-backups-dynamics/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backups will run automatically every day." -ForegroundColor Green
