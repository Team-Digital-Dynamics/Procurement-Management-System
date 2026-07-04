@echo off
REM ============================================================================
REM PMS Digital Dynamics - Automatic S3 Backup Scheduler (Admin)
REM ============================================================================
REM Run this file as Administrator to create the daily backup schedule
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo PMS Digital Dynamics - Setting Up Daily S3 Backups
echo ============================================================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: This script must run as Administrator!
    echo.
    echo To fix:
    echo   1. Right-click on this file
    echo   2. Select "Run as administrator"
    echo   3. Click "Yes" when prompted
    echo.
    pause
    exit /b 1
)

echo ✅ Running as Administrator
echo.

REM Define variables
set "TaskName=PMS-Daily-Backup-S3"
set "BackupScript=C:\Users\nonhlanhla.Sambo\Documents\TestingMain\Procurement-Management-System-main (4)\Procurement-Management-System-main\pms\scripts\backup-mysql-s3-auto.ps1"
set "ScheduleTime=01:00"

echo Creating scheduled task...
echo   Task: !TaskName!
echo   Time: !ScheduleTime! UTC (Daily)
echo   Script: !BackupScript!
echo.

REM Remove old task if it exists
tasklist /FI "TASKNAME eq schtasks.exe" 2>NUL | find /I /N "schtasks.exe">NUL
schtasks /delete /TN "!TaskName!" /F 2>NUL

REM Create the new task
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$TaskName = '!TaskName!'; " ^
  "$BackupScript = '!BackupScript!'; " ^
  "$ScheduleTime = '!ScheduleTime!'; " ^
  "$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument \"-ExecutionPolicy Bypass -NoProfile -File `\"$BackupScript`\"\"; " ^
  "$trigger = New-ScheduledTaskTrigger -Daily -At $ScheduleTime; " ^
  "$principal = New-ScheduledTaskPrincipal -UserID 'NT AUTHORITY\SYSTEM' -RunLevel Highest; " ^
  "$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -StartWhenAvailable:$true -ExecutionTimeLimit (New-TimeSpan -Minutes 30); " ^
  "$task = New-ScheduledTask -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'PMS Daily Backup to AWS S3'; " ^
  "Register-ScheduledTask -TaskName $TaskName -InputObject $task -Force | Out-Null; " ^
  "Write-Host '✅ Scheduled task created successfully!' -ForegroundColor Green"

if %errorlevel% equ 0 (
    echo.
    echo ============================================================================
    echo ✅ SUCCESS! Daily S3 Backups Scheduled
    echo ============================================================================
    echo.
    echo Your backups are now automated:
    echo   • Schedule: Every day at !ScheduleTime! UTC
    echo   • Destination: s3://pms-backups-dynamics/
    echo   • AWS Account: admindigitaldynamics@gmail.com
    echo   • Backup Format: SQL with AES256 encryption
    echo.
    echo Next steps:
    echo   1. Verify in Task Scheduler: taskschd.msc
    echo   2. Look for: !TaskName!
    echo   3. Status should be: "Ready"
    echo.
    echo Your first backup will run at !ScheduleTime! UTC tomorrow.
    echo You can manually run one now by right-clicking the task and selecting "Run".
    echo.
) else (
    echo.
    echo ============================================================================
    echo ❌ ERROR: Failed to create scheduled task
    echo ============================================================================
    echo.
    echo Make sure:
    echo   1. This script is running as Administrator
    echo   2. The backup script path is correct
    echo   3. PowerShell can access the file
    echo.
)

pause
