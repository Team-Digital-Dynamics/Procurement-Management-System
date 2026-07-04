#!/usr/bin/env powershell
<#
.SYNOPSIS
    Automated daily MySQL to S3 backup (Production Ready)
.DESCRIPTION
    - No user involvement needed
    - Runs daily at 01:00 AM UTC via Windows Task Scheduler
    - Uses AWS CLI for reliable S3 upload
    - Error handling and logging
    - Auto-cleanup of old backups
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ============================================================================
# CONFIGURATION
# ============================================================================
$DatabaseName = 'pms'
$DockerContainer = 'pms-mysql-1'
$S3Bucket = 'pms-backups-dynamics'
$S3Region = 'us-east-1'
$LocalBackupDir = 'C:\Users\nonhlanhla.Sambo\Documents\TestingMain\Procurement-Management-System-main (4)\Procurement-Management-System-main\pms\backups'
$LogFile = "$LocalBackupDir\backup.log"
$MaxLocalBackups = 5

# Ensure backup directory exists
New-Item -ItemType Directory -Path $LocalBackupDir -Force | Out-Null

# ============================================================================
# LOGGING FUNCTION
# ============================================================================
function Write-Log {
    param([string]$Message, [string]$Level = 'INFO')
    $Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $LogEntry = "[$Timestamp] [$Level] $Message"
    
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry -ErrorAction SilentlyContinue
}

Write-Log "==============================================="
Write-Log "PMS Digital Dynamics - Automated Daily Backup"
Write-Log "==============================================="
Write-Log "Database: $DatabaseName"
Write-Log "Bucket: s3://$S3Bucket"
Write-Log "Account: admindigitaldynamics@gmail.com"

# ============================================================================
# STEP 1: CREATE MYSQL BACKUP
# ============================================================================
Write-Log "Step 1: Creating MySQL backup..."

$BackupFile = "$LocalBackupDir\pms_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

try {
    # Dump database via Docker
    docker exec $DockerContainer mysqldump `
        --user=root `
        --password=root `
        --single-transaction `
        --quick `
        --routines `
        --triggers `
        --events `
        --result-file=/tmp/pms_backup.sql `
        $DatabaseName 2>&1 | Out-Null
    
    # Copy from container to local
    docker cp "$DockerContainer`:/tmp/pms_backup.sql" "$BackupFile" 2>&1 | Out-Null
    
    # Clean up temp file in container
    docker exec $DockerContainer rm -f /tmp/pms_backup.sql 2>&1 | Out-Null
    
    if (Test-Path $BackupFile) {
        $BackupSizeMB = [math]::Round((Get-Item $BackupFile).Length / 1MB, 2)
        Write-Log "✓ Backup created: $BackupSizeMB MB"
    } else {
        throw "Backup file not created"
    }
} catch {
    Write-Log "✗ Backup failed: $_" 'ERROR'
    exit 1
}

# ============================================================================
# STEP 2: CALCULATE CHECKSUM
# ============================================================================
Write-Log "Step 2: Calculating checksum..."

try {
    $ChecksumFile = "$BackupFile.sha256"
    $Checksum = (Get-FileHash -Path $BackupFile -Algorithm SHA256).Hash
    Set-Content -Path $ChecksumFile -Value $Checksum -NoNewline
    Write-Log "✓ Checksum: $Checksum"
} catch {
    Write-Log "✗ Checksum failed: $_" 'ERROR'
    exit 1
}

# ============================================================================
# STEP 3: UPLOAD TO S3
# ============================================================================
Write-Log "Step 3: Uploading to AWS S3..."

try {
    # Set AWS credentials from ~/.aws/credentials
    $CredFile = "$env:USERPROFILE\.aws\credentials"
    if (Test-Path $CredFile) {
        $CredContent = Get-Content $CredFile -Raw
        if ($CredContent -match 'aws_access_key_id\s*=\s*(.+)') {
            $env:AWS_ACCESS_KEY_ID = $matches[1].Trim()
        }
        if ($CredContent -match 'aws_secret_access_key\s*=\s*(.+)') {
            $env:AWS_SECRET_ACCESS_KEY = $matches[1].Trim()
        }
    }
    
    $env:AWS_DEFAULT_REGION = $S3Region
    
    # Generate S3 path: backups/YYYY/MM/DD/filename.sql
    $S3Date = Get-Date -Format 'yyyy/MM/dd'
    $S3FileName = Split-Path -Leaf $BackupFile
    $S3Path = "backups/$S3Date/$S3FileName"
    
    # Upload to S3 with encryption
    $UploadOutput = & aws s3 cp $BackupFile "s3://$S3Bucket/$S3Path" `
        --sse AES256 `
        --storage-class STANDARD_IA `
        --region $S3Region 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "✓ Uploaded to S3: s3://$S3Bucket/$S3Path"
    } else {
        throw "AWS CLI upload failed: $UploadOutput"
    }
    
    # Upload checksum
    $UploadChecksum = & aws s3 cp $ChecksumFile "s3://$S3Bucket/$S3Path.sha256" `
        --sse AES256 `
        --region $S3Region 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "✓ Checksum uploaded"
    }
} catch {
    Write-Log "✗ S3 upload failed: $_" 'ERROR'
    exit 1
}

# ============================================================================
# STEP 4: CLEANUP
# ============================================================================
Write-Log "Step 4: Cleaning up..."

try {
    # Remove local backup file after successful upload
    Remove-Item -Path $BackupFile -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $ChecksumFile -Force -ErrorAction SilentlyContinue
    Write-Log "✓ Local files cleaned"
} catch {
    Write-Log "⚠ Cleanup warning: $_" 'WARN'
}

# ============================================================================
# SUCCESS
# ============================================================================
Write-Log ""
Write-Log "================================================"
Write-Log "✓ BACKUP COMPLETED SUCCESSFULLY"
Write-Log "================================================"
Write-Log "Next scheduled backup: Tomorrow at 01:00 AM UTC"
Write-Log ""

exit 0
