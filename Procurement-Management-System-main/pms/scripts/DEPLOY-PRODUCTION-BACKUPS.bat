@echo off
REM ============================================================================
REM PMS AUTOMATED BACKUP SYSTEM - PRODUCTION DEPLOYMENT
REM ============================================================================
REM This script sets up automated daily S3 backups on the Procurement-Management-System
REM Run this on your production server/system ONCE as Administrator
REM ============================================================================

setlocal enabledelayedexpansion

cls
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║  PMS PRODUCTION DEPLOYMENT - Automated S3 Backups                 ║
echo ║  Account: admindigitaldynamics@gmail.com                          ║
echo ║  Bucket: pms-backups-dynamics                                     ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

REM ==========================================================================
REM VERIFY ADMIN PRIVILEGES
REM ==========================================================================
net session >nul 2>&1
if errorlevel 1 (
    echo ✗ ERROR: Administrator privileges required!
    echo.
    echo HOW TO FIX:
    echo   1. Right-click this file
    echo   2. Select "Run as administrator"
    echo   3. Click "Yes" when prompted
    echo.
    pause
    exit /b 1
)

echo ✓ Administrator privileges verified
echo.

REM ==========================================================================
REM DETECT PROJECT PATH
REM ==========================================================================
set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=!SCRIPT_DIR:scripts=!"
set "PROJECT_DIR=!PROJECT_DIR:pms\=!"

if not exist "!PROJECT_DIR!pms\scripts\backup-daily-production.ps1" (
    echo ✗ ERROR: Backup script not found
    echo   Expected: !PROJECT_DIR!pms\scripts\backup-daily-production.ps1
    echo.
    echo Make sure this script is in the correct location:
    echo   Procurement-Management-System-main\pms\scripts\
    echo.
    pause
    exit /b 1
)

echo ✓ Project structure verified
echo   Path: !PROJECT_DIR!
echo.

REM ==========================================================================
REM VERIFY PREREQUISITES
REM ==========================================================================
echo Checking prerequisites...
echo.

REM Check AWS CLI
where aws >nul 2>&1
if errorlevel 1 (
    echo ✗ AWS CLI not found
    echo.
    echo Install with:
    echo   msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('aws --version 2^>nul') do (
    echo ✓ !AWS CLI: %%i
)

REM Check AWS credentials
if not exist "%USERPROFILE%\.aws\credentials" (
    echo ✗ AWS credentials not configured
    echo.
    echo Set up with:
    echo   aws configure
    echo.
    echo Then enter your credentials:
    echo   - Access Key ID: AKIA2G5ZTAHQ2O6CCM3V
    echo   - Secret Access Key: oYSJb3PdWMLxdizxWHvlkq93ESpFadzmKEkoIG/t
    echo   - Default region: us-east-1
    echo.
    pause
    exit /b 1
)

echo ✓ AWS credentials found
echo.

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ⚠ WARNING: Docker not found (required for backups)
    echo   Install Docker Desktop before running backups
    echo.
) else (
    for /f "tokens=*" %%i in ('docker --version 2^>nul') do (
        echo ✓ %%i
    )
)

REM Check MySQL container
docker ps --filter "name=mysql" --format "{{.Names}}" >nul 2>&1
if errorlevel 1 (
    echo ⚠ WARNING: MySQL container may not be running
    echo   Run: docker-compose up -d
    echo.
) else (
    echo ✓ MySQL container detected
)

echo.

REM ==========================================================================
REM SETUP SCHEDULED TASK
REM ==========================================================================
set "TASK_NAME=PMS-Daily-Backup-S3"
set "BACKUP_SCRIPT=!PROJECT_DIR!pms\scripts\backup-daily-production.ps1"
set "SCHEDULE_TIME=01:00"
set "S3_BUCKET=pms-backups-dynamics"
set "S3_ACCOUNT=admindigitaldynamics@gmail.com"

echo Configuration:
echo   Task: !TASK_NAME!
echo   Schedule: Daily at !SCHEDULE_TIME! UTC
echo   Bucket: !S3_BUCKET!
echo   Account: !S3_ACCOUNT!
echo   Script: !BACKUP_SCRIPT!
echo.

REM Remove existing task
schtasks /delete /tn "!TASK_NAME!" /f >nul 2>&1

REM Create scheduled task using PowerShell
echo Creating scheduled task...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$TaskName = '!TASK_NAME!'; " ^
  "$BackupScript = '!BACKUP_SCRIPT!'; " ^
  "$ScheduleTime = '!SCHEDULE_TIME!'; " ^
  "$Action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument \"-ExecutionPolicy Bypass -NoProfile -File `\"$BackupScript`\"\"; " ^
  "$Trigger = New-ScheduledTaskTrigger -Daily -At $ScheduleTime; " ^
  "$Principal = New-ScheduledTaskPrincipal -UserID 'NT AUTHORITY\SYSTEM' -RunLevel Highest; " ^
  "$Settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -StartWhenAvailable:$true -ExecutionTimeLimit (New-TimeSpan -Minutes 30) -RunOnlyIfNetworkAvailable:$true; " ^
  "$Task = New-ScheduledTask -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'PMS Daily Backup to AWS S3'; " ^
  "Register-ScheduledTask -TaskName $TaskName -InputObject $task -Force | Out-Null; " ^
  "Write-Host 'Task scheduled successfully' -ForegroundColor Green"

if errorlevel 1 (
    echo.
    echo ✗ Failed to create scheduled task
    echo   Make sure you're running as Administrator
    pause
    exit /b 1
)

echo.
echo.

REM ==========================================================================
REM VERIFY TASK CREATION
REM ==========================================================================
timeout /t 2 /nobreak >nul

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$Task = Get-ScheduledTask -TaskName '!TASK_NAME!' -ErrorAction SilentlyContinue; " ^
  "if ($Task) { Write-Host '✓ Task Status: ' $Task.State -ForegroundColor Green } " ^
  "else { Write-Host '✗ Task not found' -ForegroundColor Red; exit 1 }"

if errorlevel 1 (
    echo.
    echo ✗ Task verification failed
    pause
    exit /b 1
)

echo.
echo.

REM ==========================================================================
REM SUCCESS MESSAGE
REM ==========================================================================
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║  ✓ PRODUCTION DEPLOYMENT COMPLETE!                               ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

echo Your PMS backups are now LIVE:
echo.
echo   AUTOMATIC BACKUPS:
echo   • Every day at !SCHEDULE_TIME! UTC
echo   • MySQL database dumped to SQL file
echo   • Encrypted and uploaded to S3
echo   • File path: s3://!S3_BUCKET!/backups/YYYY/MM/DD/
echo.

echo   ZERO MANUAL INTERVENTION:
echo   • No scripts to run
echo   • No passwords to enter
echo   • No monitoring needed
echo.

echo   NEXT BACKUP:
echo   • Tomorrow at !SCHEDULE_TIME! UTC
echo   • Check S3 console after backup completes
echo.

echo   VERIFY SETUP:
echo   1. Task Scheduler: taskschd.msc
echo   2. Look for: !TASK_NAME!
echo   3. Status should be: Ready
echo.

echo   VIEW BACKUPS:
echo   1. https://console.aws.amazon.com/s3/
echo   2. Bucket: !S3_BUCKET!
echo   3. Folder: backups/YYYY/MM/DD/
echo.

echo   DOWNLOAD A BACKUP:
echo   aws s3 cp s3://!S3_BUCKET!/backups/2026/07/04/pms_*.sql .
echo.

echo   DOCUMENTATION:
echo   • !PROJECT_DIR!pms\docs\BACKUP-SETUP.md
echo.

echo Deployment timestamp: %date% %time%
echo.
pause
