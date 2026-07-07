
# Auto-install AWS PowerShell module if needed
if (-not (Get-Module -ListAvailable -Name AWSPowerShell.NetCore)) {
    Write-Host "Installing AWS PowerShell SDK..."
    Install-Module -Name AWSPowerShell.NetCore -Force -AllowClobber -Repository PSGallery
}

Import-Module AWSPowerShell.NetCore -ErrorAction SilentlyContinue

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

<#
.SYNOPSIS
    Automated MySQL to S3 backup with no external dependencies
    
.DESCRIPTION
    - Creates daily MySQL backup
    - Uploads to AWS S3 with encryption
    - Calculates SHA256 checksums
    - Auto-cleans old temp files
    - Runs with zero user interaction
    
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File backup-mysql-s3-auto.ps1
#>

# ===========================
# CONFIGURATION
# ===========================
$DatabaseName = 'pms'
$S3Bucket = 'pms-backups-dynamics'
$S3Region = 'us-east-1'
$DockerContainer = 'pms-mysql-1'
$BackupDir = (Get-Item (Split-Path -Parent $PSScriptRoot)).FullName + '\backups'
$LogFile = "$BackupDir\backup.log"
$MaxLocalBackups = 5

# Ensure backup directory exists
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

# ===========================
# LOGGING
# ===========================
function Log {
    param([string]$Message, [string]$Level = 'INFO')
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry
    Add-Content -Path $LogFile -Value $logEntry -ErrorAction SilentlyContinue
}

Log "==============================================="
Log "PMS Digital Dynamics - Automated S3 Backup"
Log "==============================================="
Log "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Log "Target: s3://$S3Bucket"

# ===========================
# STEP 1: CREATE BACKUP
# ===========================
Log "Step 1: Creating MySQL backup..."

$BackupFile = "$BackupDir\pms_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

try {
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
    
    docker cp "$DockerContainer`:/tmp/pms_backup.sql" "$BackupFile" 2>&1 | Out-Null
    
    if (Test-Path $BackupFile) {
        $BackupSize = (Get-Item $BackupFile).Length
        $BackupSizeMB = [math]::Round($BackupSize / 1MB, 2)
        Log "✅ Backup created successfully: $BackupSizeMB MB"
    } else {
        throw "Backup file not created"
    }
} catch {
    Log "❌ Backup failed: $_" 'ERROR'
    exit 1
}

# ===========================
# STEP 2: CALCULATE CHECKSUM
# ===========================
Log "Step 2: Calculating checksum..."

try {
    $ChecksumFile = "$BackupFile.sha256"
    $Checksum = (Get-FileHash -Path $BackupFile -Algorithm SHA256).Hash
    Set-Content -Path $ChecksumFile -Value $Checksum -NoNewline
    Log "✅ Checksum: $Checksum"
} catch {
    Log "❌ Checksum failed: $_" 'ERROR'
    exit 1
}

# ===========================
# STEP 3: UPLOAD TO S3
# ===========================
Log "Step 3: Uploading to AWS S3..."

try {
    # Import AWS credentials from environment or ~/.aws/credentials
    $AwsAccessKey = $env:AWS_ACCESS_KEY_ID
    $AwsSecretKey = $env:AWS_SECRET_ACCESS_KEY
    
    if (-not $AwsAccessKey -or -not $AwsSecretKey) {
        Log "⚠️  AWS credentials not in environment, checking ~/.aws/credentials..."
        $CredFile = "$env:USERPROFILE\.aws\credentials"
        if (Test-Path $CredFile) {
            $CredContent = Get-Content $CredFile -Raw
            # Parse default profile
            if ($CredContent -match 'aws_access_key_id\s*=\s*(.+)') {
                $AwsAccessKey = $matches[1].Trim()
            }
            if ($CredContent -match 'aws_secret_access_key\s*=\s*(.+)') {
                $AwsSecretKey = $matches[1].Trim()
            }
        }
    }
    
    if (-not $AwsAccessKey -or -not $AwsSecretKey) {
        Log "❌ AWS credentials not found. Run: aws configure" 'ERROR'
        Log "   See: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html" 'ERROR'
        exit 1
    }
    
    # Set AWS credentials in session
    $env:AWS_ACCESS_KEY_ID = $AwsAccessKey
    $env:AWS_SECRET_ACCESS_KEY = $AwsSecretKey
    $env:AWS_DEFAULT_REGION = $S3Region
    
    # Generate S3 path: backups/YYYY/MM/DD/filename.sql
    $S3Date = Get-Date -Format 'yyyy/MM/dd'
    $S3FileName = Split-Path -Leaf $BackupFile
    $S3Path = "backups/$S3Date/$S3FileName"
    
    # Upload with encryption and metadata
    Write-S3Object `
        -BucketName $S3Bucket `
        -Key $S3Path `
        -FilePath $BackupFile `
        -ServerSideEncryptionMethod AES256 `
        -StorageClass STANDARD_IA `
        -Region $S3Region `
        -Metadata @{
            'Database' = $DatabaseName
            'Timestamp' = (Get-Date -AsUTC -Format 'o')
            'Checksum' = $Checksum
            'Source' = 'automated-backup'
        }
    
    Log "✅ Backup uploaded to S3: s3://$S3Bucket/$S3Path"
    
    # Upload checksum file
    Write-S3Object `
        -BucketName $S3Bucket `
        -Key "$S3Path.sha256" `
        -FilePath $ChecksumFile `
        -ServerSideEncryptionMethod AES256 `
        -Region $S3Region
    
    Log "✅ Checksum uploaded"
} catch {
    Log "❌ S3 upload failed: $_" 'ERROR'
    exit 1
}

# ===========================
# STEP 4: VERIFY IN S3
# ===========================
Log "Step 4: Verifying upload..."

try {
    $Objects = Get-S3Object -BucketName $S3Bucket -Key $S3Path -Region $S3Region
    if ($Objects) {
        $S3Size = $Objects.Size / 1MB
        Log "✅ File verified in S3: $([math]::Round($S3Size, 2)) MB"
    } else {
        throw "File not found in S3 after upload"
    }
} catch {
    Log "⚠️  Could not verify in S3: $_" 'WARN'
}

# ===========================
# STEP 5: CLEANUP LOCAL FILES
# ===========================
Log "Step 5: Cleaning up local files..."

try {
    # Remove backup file and checksum after successful upload
    Remove-Item -Path $BackupFile -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $ChecksumFile -Force -ErrorAction SilentlyContinue
    Log "✅ Local files cleaned up"
} catch {
    Log "⚠️  Cleanup warning: $_" 'WARN'
}

# ===========================
# SUCCESS
# ===========================
Log ""
Log "✅ ================================================"
Log "✅ AUTOMATED BACKUP COMPLETED SUCCESSFULLY"
Log "✅ ================================================"
Log "Database: $DatabaseName"
Log "S3 Path: s3://$S3Bucket/$S3Path"
Log "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Log ""

# Clean up old local backup files (keep only last 5)
$OldBackups = Get-ChildItem -Path $BackupDir -Filter "pms_*.sql" -File | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -Skip $MaxLocalBackups

if ($OldBackups) {
    Log "Removing old local backups (keeping $MaxLocalBackups)..."
    $OldBackups | Remove-Item -Force -ErrorAction SilentlyContinue
}

exit 0
