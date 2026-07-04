@echo off
REM ============================================================================
REM PMS DIGITAL DYNAMICS - AUTOMATED DAILY S3 BACKUPS
REM ============================================================================
REM Run this ONCE as Administrator to set up automatic daily backups
REM After that, backups run completely automatically every day at 01:00 AM UTC
REM Zero user involvement required
REM ============================================================================

setlocal enabledelayedexpansion

cls
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║  PMS AUTOMATED DAILY S3 BACKUP SETUP                              ║
echo ║  (Run once as Administrator - then forget about it)               ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

REM Check admin privileges
net session >nul 2>&1
if errorlevel 1 (
    echo ✗ ERROR: Must run as Administrator
    echo.
    echo HOW TO FIX:
    echo   1. Right-click on this file
    echo   2. Select "Run as administrator"
    echo   3. Click "Yes" when prompted
    echo.
    pause
    exit /b 1
)

echo ✓ Running as Administrator
echo.

REM Define paths and settings
set "TASK_NAME=PMS-Daily-Backup-S3"
set "BACKUP_SCRIPT=C:\Users\nonhlanhla.Sambo\Documents\TestingMain\Procurement-Management-System-main (4)\Procurement-Management-System-main\pms\scripts\backup-daily-production.ps1"
set "SCHEDULE_TIME=01:00"
set "AWS_BUCKET=pms-backups-dynamics"
set "AWS_ACCOUNT=admindigitaldynamics@gmail.com"

REM Verify backup script exists
if not exist "!BACKUP_SCRIPT!" (
    echo ✗ ERROR: Backup script not found
    echo   Location: !BACKUP_SCRIPT!
    pause
    exit /b 1
)

echo ✓ Backup script verified
echo.

REM Verify AWS credentials
if not exist "%USERPROFILE%\.aws\credentials" (
    echo ✗ ERROR: AWS credentials not configured
    echo   Run this first: aws configure
    echo   Or set up credentials in: %USERPROFILE%\.aws\credentials
    pause
    exit /b 1
)

echo ✓ AWS credentials found
echo.

REM Display configuration
echo Configuration:
echo   Bucket: !AWS_BUCKET!
echo   Account: !AWS_ACCOUNT!
echo   Schedule: Daily at !SCHEDULE_TIME! UTC
echo   First Backup: Tomorrow at !SCHEDULE_TIME!
echo.

REM Remove existing task
schtasks /delete /tn "!TASK_NAME!" /f >nul 2>&1

REM Create the scheduled task
echo Creating scheduled task...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$TaskName = '!TASK_NAME!'; " ^
  "$BackupScript = '!BACKUP_SCRIPT!'; " ^
  "$ScheduleTime = '!SCHEDULE_TIME!'; " ^
  "$Action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument \"-ExecutionPolicy Bypass -NoProfile -File `\"$BackupScript`\"\"; " ^
  "$Trigger = New-ScheduledTaskTrigger -Daily -At $ScheduleTime; " ^
  "$Principal = New-ScheduledTaskPrincipal -UserID 'NT AUTHORITY\SYSTEM' -RunLevel Highest; " ^
  "$Settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -StartWhenAvailable:`$true -ExecutionTimeLimit (New-TimeSpan -Minutes 30) -RunOnlyIfNetworkAvailable:`$true; " ^
  "$Task = New-ScheduledTask -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'PMS Daily Backup to AWS S3'; " ^
  "Register-ScheduledTask -TaskName $TaskName -InputObject $task -Force | Out-Null; " ^
  "Write-Host 'Task created successfully' -ForegroundColor Green"

if errorlevel 1 (
    echo.
    echo ✗ Failed to create scheduled task
    pause
    exit /b 1
)

echo.
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║  ✓ AUTOMATED BACKUPS CONFIGURED SUCCESSFULLY!                    ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

echo Your backup system is now set up:
echo.
echo   WHAT HAPPENS:
echo   • Every day at !SCHEDULE_TIME! UTC, a backup runs automatically
echo   • MySQL database is dumped to a SQL file
echo   • File is encrypted and uploaded to S3
echo   • File is stored in: s3://!AWS_BUCKET!/backups/YYYY/MM/DD/
echo   • Backup completes in ~30-45 seconds
echo   • Local files are cleaned up automatically
echo.

echo   ZERO USER INVOLVEMENT NEEDED:
echo   • No manual intervention required
echo   • No scripts to run
echo   • No passwords to enter
echo   • Runs on system startup if needed
echo.

echo   TO VERIFY SETUP:
echo   1. Open Task Scheduler: taskschd.msc
echo   2. Look for: !TASK_NAME!
echo   3. Status should show: Ready
echo.

echo   TO CHECK YOUR BACKUPS:
echo   1. Go to: https://console.aws.amazon.com/s3/
echo   2. Click bucket: !AWS_BUCKET!
echo   3. Navigate to: backups/YYYY/MM/DD/
echo   4. Each day's backup will be there
echo.

echo   TO DOWNLOAD A BACKUP:
echo   aws s3 cp s3://!AWS_BUCKET!/backups/2026/07/04/pms_*.sql .
echo.

echo Setup completed: %date% %time%
echo.
pause
