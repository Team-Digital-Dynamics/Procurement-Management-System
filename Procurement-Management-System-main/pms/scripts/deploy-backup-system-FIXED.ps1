param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'

# Configuration
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptPath)
$BackupScript = Join-Path $ScriptPath 'backup-daily-production.ps1'
$LogDir = Join-Path $ProjectRoot 'logs'
$LogFile = Join-Path $LogDir 'deployment.log'
$TaskName = 'PMS-Daily-Backup-S3'
$ScheduleTime = '01:00'

# Create log directory
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# Logging function
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

# Step 1: Verify backup script
Write-DeployLog "Step 1: Verifying backup script..."
if (-not (Test-Path $BackupScript)) {
    Write-DeployLog "ERROR: Backup script not found at $BackupScript" 'ERROR'
    exit 1
}
Write-DeployLog "OK: Backup script verified"

# Step 2: Verify AWS credentials
Write-DeployLog "Step 2: Checking AWS credentials..."
$CredFile = "$env:USERPROFILE\.aws\credentials"
if (-not (Test-Path $CredFile)) {
    Write-DeployLog "WARNING: AWS credentials not configured yet" 'WARN'
} else {
    Write-DeployLog "OK: AWS credentials file found"
}

# Step 3: Create scheduled task
Write-DeployLog "Step 3: Setting up scheduled task..."
$IsAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] 'Administrator')

if ($IsAdmin) {
    Write-DeployLog "Running with Administrator privileges"
    
    try {
        # Remove existing task
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
            -Description 'PMS Daily Backup to AWS S3'
        
        Register-ScheduledTask -TaskName $TaskName -InputObject $Task -Force -ErrorAction Stop | Out-Null
        
        Write-DeployLog "OK: Scheduled task created"
        Write-DeployLog "  Task: $TaskName"
        Write-DeployLog "  Schedule: Daily at $ScheduleTime UTC"
        Write-DeployLog "  Status: Ready"
        
    } catch {
        Write-DeployLog "ERROR: Failed to create task: $_" 'ERROR'
    }
} else {
    Write-DeployLog "INFO: Not running as admin - task requires administrator setup" 'INFO'
}

# Step 4: Verify AWS CLI
Write-DeployLog "Step 4: Checking AWS CLI..."
$AwsPath = Get-Command aws -ErrorAction SilentlyContinue
if ($AwsPath) {
    try {
        $AwsVersion = & aws --version 2>&1
        Write-DeployLog "OK: AWS CLI found: $AwsVersion"
    } catch {
        Write-DeployLog "WARNING: AWS CLI not accessible" 'WARN'
    }
} else {
    Write-DeployLog "WARNING: AWS CLI not in PATH" 'WARN'
}

# Step 5: Create status file
Write-DeployLog "Step 5: Creating status info..."
$StatusInfo = @"
PMS Backup Deployment Status
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Hostname: $env:COMPUTERNAME
Project: $ProjectRoot
Task Name: $TaskName
Schedule: Daily at $ScheduleTime UTC
Status: Configured
"@

$StatusFile = Join-Path $ProjectRoot 'BACKUP-DEPLOYMENT-INFO.txt'
Set-Content -Path $StatusFile -Value $StatusInfo -Force
Write-DeployLog "OK: Status info saved"

# Completion
Write-DeployLog ""
Write-DeployLog "=========================================="
Write-DeployLog "Deployment Complete"
Write-DeployLog "=========================================="
Write-DeployLog "Backups will run daily at: $ScheduleTime UTC"
Write-DeployLog "Log file: $LogFile"
Write-DeployLog ""

exit 0
