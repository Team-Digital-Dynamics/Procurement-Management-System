@echo off
setlocal enabledelayedexpansion

cls
echo.
echo ============================================================================
echo PMS Digital Dynamics - Automated S3 Backup Setup
echo ============================================================================
echo.

net session >nul 2>&1
if errorlevel 1 (
    echo ERROR: This must run as Administrator!
    echo.
    echo HOW TO FIX:
    echo   1. Find this file in Explorer
    echo   2. Right-click on it
    echo   3. Select "Run as administrator"
    echo   4. Click "Yes" when prompted
    echo.
    pause
    exit /b 1
)

echo ✓ Running with Administrator privileges
echo.

set TASK_NAME=PMS-Daily-Backup-S3
set BACKUP_SCRIPT=C:\Users\nonhlanhla.Sambo\Documents\TestingMain\Procurement-Management-System-main (4)\Procurement-Management-System-main\pms\scripts\backup-mysql-s3-auto.ps1
set SCHEDULE_TIME=01:00

if not exist "!BACKUP_SCRIPT!" (
    echo ERROR: Backup script not found
    echo Location: !BACKUP_SCRIPT!
    pause
    exit /b 1
)

echo ✓ Backup script found
echo.
echo Creating scheduled task...
echo   Name: !TASK_NAME!
echo   Time: !SCHEDULE_TIME! UTC
echo.

tasklist /fi "TASKNAME eq schtasks.exe" 2>nul | find /i /n "schtasks.exe" >nul

schtasks /delete /tn "!TASK_NAME!" /f 2>nul

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$TaskName = '!TASK_NAME!'; " ^
  "$BackupScript = '!BACKUP_SCRIPT!'; " ^
  "$ScheduleTime = '!SCHEDULE_TIME!'; " ^
  "$Action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument \"-ExecutionPolicy Bypass -NoProfile -File `\"$BackupScript`\"\"; " ^
  "$Trigger = New-ScheduledTaskTrigger -Daily -At $ScheduleTime; " ^
  "$Principal = New-ScheduledTaskPrincipal -UserID 'NT AUTHORITY\SYSTEM' -RunLevel Highest; " ^
  "$Settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -StartWhenAvailable:$true -ExecutionTimeLimit (New-TimeSpan -Minutes 30); " ^
  "$Task = New-ScheduledTask -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -Description 'PMS Daily Backup to S3'; " ^
  "Register-ScheduledTask -TaskName $TaskName -InputObject $Task -Force | Out-Null; " ^
  "Write-Host 'SUCCESS!' -ForegroundColor Green"

echo.
echo ============================================================================
echo COMPLETE! Automated Daily S3 Backups Scheduled
echo ============================================================================
echo.
echo Your backups are now configured:
echo   • Schedule: Every day at !SCHEDULE_TIME! UTC
echo   • Destination: s3://pms-backups-dynamics/
echo   • AWS Account: admindigitaldynamics@gmail.com
echo   • First backup: Tomorrow at !SCHEDULE_TIME!
echo.
echo To verify:
echo   1. Press Win+R
echo   2. Type: taskschd.msc
echo   3. Look for: !TASK_NAME!
echo   4. Status should show: Ready
echo.
pause
