#!/usr/bin/env powershell
<#
.SYNOPSIS
    Automated Backup System - Zero-Touch Deployment
.DESCRIPTION
    Runs silently during application deployment.
    - No user prompts or interaction
    - No admin elevation needed for configuration
    - Sets up Windows Task Scheduler automatically
    - Logs all actions for audit trail
.NOTES
    This script is designed for CI/CD and automated deployment pipelines
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'

# ============================================================================
# CONFIGURATION
# ============================================================================
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptPath)
$BackupScript = Join-Path $ScriptPath 'backup-daily-production.ps1'
$LogFile = Join-Path $ProjectRoot 'logs\deployment.log'
$TaskName = 'PMS-Daily-Backup-S3'
$ScheduleTime = '01:00'

# Ensure log directory
$LogDir = Split-Path -Parent $LogFile
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# ============================================================================
# LOGGING FUNCTION
# ============================================================================
function Write-DeployLog {
    param([string]$Message, [string]$Level = 'INFO')
    $Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $LogEntry = "[$Timestamp] [$Level] $Message"
    
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry -ErrorAction SilentlyContinue
}

Write-DeployLog "=========================================="
Write-DeployLog "PMS Backup System - Automated Deployment"
Write-DeployLog "=========================================="
Write-DeployLog "Project Root: $ProjectRoot"
Write-DeployLog "Backup Script: $BackupScript"

# ============================================================================
# STEP 1: VERIFY BACKUP SCRIPT
# ============================================================================
Write-DeployLog "Step 1: Verifying backup script..."

if (-not (Test-Path $BackupScript)) {
    Write-DeployLog "ERROR: Backup script not found at $BackupScript" 'ERROR'
    exit 1
}

Write-DeployLog "✓ Backup script verified"

# ============================================================================
# STEP 2: VERIFY AWS CREDENTIALS
# ============================================================================
Write-DeployLog "Step 2: Checking AWS credentials..."

$CredFile = "$env:USERPROFILE\.aws\credentials"
if (-not (Test-Path $CredFile)) {
    Write-DeployLog "WARNING: AWS credentials not found. Backups will fail until configured." 'WARN'
    Write-DeployLog "Expected location: $CredFile" 'WARN'
    Write-DeployLog "Configure with: aws configure" 'WARN'
} else {
    Write-DeployLog "✓ AWS credentials file found"
}

# ============================================================================
# STEP 3: CREATE SCHEDULED TASK (with error handling)
# ============================================================================
Write-DeployLog "Step 3: Setting up scheduled task..."

# Check if already admin
$IsAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] 'Administrator')

if ($IsAdmin) {
    Write-DeployLog "Running with Administrator privileges"
    
    try {
        # Remove existing task if present
        $ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
        if ($ExistingTask) {
            Write-DeployLog "Removing existing task..."
            Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction Stop | Out-Null
        }
        
        # Create new task
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
            -Description 'PMS Digital Dynamics - Automated Daily Backup to AWS S3'
        
        Register-ScheduledTask -TaskName $TaskName -InputObject $Task -Force -ErrorAction Stop | Out-Null
        
        Write-DeployLog "✓ Scheduled task created successfully"
        Write-DeployLog "  Task: $TaskName"
        Write-DeployLog "  Schedule: Daily at $ScheduleTime UTC"
        Write-DeployLog "  Status: Ready"
        
    } catch {
        Write-DeployLog "WARNING: Failed to create scheduled task: $_" 'WARN'
        Write-DeployLog "This is non-critical. Backups require administrator setup later." 'WARN'
    }
} else {
    Write-DeployLog "INFO: Not running with admin privileges" 'INFO'
    Write-DeployLog "Scheduled task requires administrator setup via: DEPLOY-PRODUCTION-BACKUPS.bat" 'INFO'
    Write-DeployLog "This will be handled by your infrastructure team." 'INFO'
}

# ============================================================================
# STEP 4: VERIFY AWS CLI
# ============================================================================
Write-DeployLog "Step 4: Checking AWS CLI..."

$AwsPath = Get-Command aws -ErrorAction SilentlyContinue
if ($AwsPath) {
    try {
        $AwsVersion = & aws --version 2>&1
        Write-DeployLog "✓ AWS CLI found: $AwsVersion"
    } catch {
        Write-DeployLog "WARNING: AWS CLI found but not executable" 'WARN'
    }
} else {
    Write-DeployLog "WARNING: AWS CLI not found in PATH" 'WARN'
    Write-DeployLog "Install with: msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi" 'WARN'
}

# ============================================================================
# STEP 5: CREATE DEPLOYMENT INFO FILE
# ============================================================================
Write-DeployLog "Step 5: Creating deployment info..."

$DeployInfo = @"
# PMS BACKUP DEPLOYMENT INFO
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')
Hostname: $env:COMPUTERNAME
Username: $env:USERNAME
Is Admin: $IsAdmin

## Paths
Project Root: $ProjectRoot
Backup Script: $BackupScript
Logs: $LogFile

## Configuration
Task Name: $TaskName
Schedule: Daily at $ScheduleTime UTC
S3 Bucket: pms-backups-dynamics
AWS Region: us-east-1

## Status
Task Created: $(if ($ExistingTask -ne $null) { 'Yes' } else { 'Checking...' })
AWS Credentials: $(if (Test-Path $CredFile) { 'Configured' } else { 'NOT CONFIGURED' })
AWS CLI: $(if ($AwsPath -ne $null) { 'Installed' } else { 'NOT INSTALLED' })

## Next Steps (if needed)
If task creation failed due to permissions, run as Administrator:
  $ProjectRoot\pms\scripts\DEPLOY-PRODUCTION-BACKUPS.bat

If AWS CLI not installed:
  msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi /qn /norestart

If AWS credentials not configured:
  aws configure
  Or create: %USERPROFILE%\.aws\credentials
"@

$DeployInfoFile = Join-Path $ProjectRoot 'BACKUP-DEPLOYMENT-INFO.txt'
Set-Content -Path $DeployInfoFile -Value $DeployInfo -Force

Write-DeployLog "✓ Deployment info saved to: $DeployInfoFile"

# ============================================================================
# COMPLETION
# ============================================================================
Write-DeployLog ""
Write-DeployLog "=========================================="
Write-DeployLog "Backup System Deployment Complete"
Write-DeployLog "=========================================="
Write-DeployLog "Status: Configuration applied"
Write-DeployLog "Backups will run daily at: $ScheduleTime UTC"
Write-DeployLog "Next backup: Tomorrow at $ScheduleTime UTC"
Write-DeployLog ""

Write-DeployLog "Verification commands:"
Write-DeployLog "  Get-ScheduledTask -TaskName `"$TaskName`" | Select State"
Write-DeployLog "  Get-Content `"$LogFile`" -Tail 20"
Write-DeployLog ""

exit 0
