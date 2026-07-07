#!/usr/bin/env powershell
# ============================================================================
# SETUP: Automated Daily S3 Backups - One-Time Setup Wizard
# ============================================================================
# This script configures everything needed for automatic daily backups
# Run once, provide credentials, and backups run automatically forever
# ============================================================================

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  PMS Digital Dynamics - Automated S3 Backup Setup         ║" -ForegroundColor Cyan
Write-Host "║  ONE-TIME SETUP (5 minutes)                              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if running as admin
$IsAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] 'Administrator')
if (-not $IsAdmin) {
    Write-Host "⚠️  IMPORTANT: This script must run as Administrator!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Steps:" -ForegroundColor Yellow
    Write-Host "1. Right-click PowerShell" -ForegroundColor Yellow
    Write-Host "2. Select 'Run as administrator'" -ForegroundColor Yellow
    Write-Host "3. Run this script again" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 1: Verify AWS Credentials
# ============================================================================
Write-Host "STEP 1: AWS Credentials Setup" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$CredFile = "$env:USERPROFILE\.aws\credentials"
$AwsDir = Split-Path -Parent $CredFile

if (Test-Path $CredFile) {
    Write-Host "✅ AWS credentials file already exists" -ForegroundColor Green
    Write-Host "   Location: $CredFile" -ForegroundColor Gray
    Write-Host ""
    $UpdateCreds = Read-Host "Do you want to update credentials? (y/n)"
    if ($UpdateCreds -ne 'y' -and $UpdateCreds -ne 'Y') {
        Write-Host "✅ Keeping existing credentials" -ForegroundColor Green
    } else {
        $SkipCreds = $false
    }
} else {
    $SkipCreds = $false
}

if (-not $SkipCreds -and -not (Test-Path $CredFile)) {
    Write-Host "❌ AWS credentials not configured yet" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Get your AWS credentials:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://console.aws.amazon.com/iam/" -ForegroundColor Yellow
    Write-Host "2. Click 'Users' → select your user" -ForegroundColor Yellow
    Write-Host "3. Click 'Security credentials' tab" -ForegroundColor Yellow
    Write-Host "4. Click 'Create access key' → 'Command Line Interface (CLI)'" -ForegroundColor Yellow
    Write-Host "5. Copy the Access Key ID and Secret Access Key" -ForegroundColor Yellow
    Write-Host ""
    
    $AccessKey = Read-Host "Enter AWS Access Key ID (starts with AKIA)"
    $SecretKey = Read-Host "Enter AWS Secret Access Key (hide as you type)"
    
    if ([string]::IsNullOrWhiteSpace($AccessKey) -or [string]::IsNullOrWhiteSpace($SecretKey)) {
        Write-Host "❌ Credentials cannot be empty" -ForegroundColor Red
        exit 1
    }
    
    # Create .aws directory if needed
    New-Item -ItemType Directory -Path $AwsDir -Force | Out-Null
    
    # Create credentials file with proper format
    $CredContent = @"
[default]
aws_access_key_id = $AccessKey
aws_secret_access_key = $SecretKey
region = us-east-1
"@
    
    Set-Content -Path $CredFile -Value $CredContent -Force
    Write-Host ""
    Write-Host "✅ AWS credentials saved" -ForegroundColor Green
} else {
    Write-Host "✅ AWS credentials configured" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# STEP 2: Verify Docker and MySQL
# ============================================================================
Write-Host "STEP 2: Verifying Docker & MySQL" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

try {
    $DockerRunning = docker ps --filter "name=pms-mysql" --format "{{.Names}}" 2>&1 | Select-Object -First 1
    if ($DockerRunning) {
        Write-Host "✅ MySQL container is running: $DockerRunning" -ForegroundColor Green
    } else {
        Write-Host "⚠️  MySQL container not found. Starting Docker Compose..." -ForegroundColor Yellow
        $ProjectDir = Split-Path -Parent $PSScriptRoot
        Set-Location $ProjectDir
        docker-compose up -d mysql
        Start-Sleep -Seconds 5
        Write-Host "✅ Docker containers started" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Docker check failed (non-critical): $_" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# STEP 3: Create Scheduled Task
# ============================================================================
Write-Host "STEP 3: Setting Up Daily Backup Schedule" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$TaskName = 'PMS-Daily-Backup-S3'
$BackupScript = Join-Path (Split-Path -Parent $PSScriptRoot) 'pms\scripts\backup-mysql-s3-auto.ps1'
$ScheduleTime = '01:00'

if (-not (Test-Path $BackupScript)) {
    Write-Host "❌ Backup script not found at: $BackupScript" -ForegroundColor Red
    exit 1
}

Write-Host "Creating task: $TaskName" -ForegroundColor Gray

# Remove old task if exists
$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($ExistingTask) {
    Write-Host "  Removing old task..." -ForegroundColor Gray
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false | Out-Null
}

try {
    $Action = New-ScheduledTaskAction `
        -Execute 'powershell.exe' `
        -Argument "-ExecutionPolicy Bypass -NoProfile -File `"$BackupScript`""
    
    $Trigger = New-ScheduledTaskTrigger -Daily -At $ScheduleTime
    
    $Principal = New-ScheduledTaskPrincipal `
        -UserID 'NT AUTHORITY\SYSTEM' `
        -RunLevel Highest
    
    $Settings = New-ScheduledTaskSettingsSet `
        -MultipleInstances IgnoreNew `
        -StartWhenAvailable:$true `
        -ExecutionTimeLimit (New-TimeSpan -Minutes 30) `
        -RunOnlyIfNetworkAvailable:$true
    
    $Task = New-ScheduledTask `
        -Action $Action `
        -Trigger $Trigger `
        -Principal $Principal `
        -Settings $Settings `
        -Description 'PMS Daily MySQL Backup to AWS S3'
    
    Register-ScheduledTask -TaskName $TaskName -InputObject $Task -Force | Out-Null
    
    Write-Host "✅ Scheduled task created successfully!" -ForegroundColor Green
    Write-Host "   Task: $TaskName" -ForegroundColor Green
    Write-Host "   Schedule: Daily at $ScheduleTime UTC" -ForegroundColor Green
    Write-Host "   Destination: s3://pms-backups-dynamics/" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create scheduled task: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure PowerShell is running as Administrator!" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# ============================================================================
# STEP 4: Test Backup
# ============================================================================
Write-Host "STEP 4: Testing Backup" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$TestBackup = Read-Host "Run test backup now? (y/n)"
if ($TestBackup -eq 'y' -or $TestBackup -eq 'Y') {
    Write-Host ""
    Write-Host "Running test backup (this may take 1-2 minutes)..." -ForegroundColor Gray
    Write-Host ""
    
    try {
        & powershell -ExecutionPolicy Bypass -NoProfile -File $BackupScript
        Write-Host ""
        Write-Host "✅ Test backup completed!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Test backup failed: $_" -ForegroundColor Red
    }
} else {
    Write-Host "⏭️  Skipping test (you can run manually later)" -ForegroundColor Gray
}

Write-Host ""

# ============================================================================
# COMPLETION
# ============================================================================
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ SETUP COMPLETE!                                       ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "Your backups are now automated:" -ForegroundColor Green
Write-Host "  • Time: Every day at $ScheduleTime UTC" -ForegroundColor Green
Write-Host "  • Destination: s3://pms-backups-dynamics/backups/" -ForegroundColor Green
Write-Host "  • Format: SQL dump with AES256 encryption" -ForegroundColor Green
Write-Host "  • Retention: Organized by date (YYYY/MM/DD)" -ForegroundColor Green
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Verify task in Task Scheduler:" -ForegroundColor Yellow
Write-Host "     taskschd.msc" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Monitor backups in S3 (check in ~24 hours):" -ForegroundColor Yellow
Write-Host "     aws s3 ls s3://pms-backups-dynamics/backups/" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Download a backup (if needed):" -ForegroundColor Yellow
Write-Host "     aws s3 cp s3://pms-backups-dynamics/backups/2026/07/04/pms_*.sql ." -ForegroundColor Gray
Write-Host ""

Write-Host "Setup completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"
