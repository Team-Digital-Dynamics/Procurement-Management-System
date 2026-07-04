Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

<#
.SYNOPSIS
    Daily MySQL backup to AWS S3 for PMS Digital Dynamics

.DESCRIPTION
    Creates a MySQL dump and uploads it to AWS S3 bucket: pms-backups-dynamics
    
.PARAMETER Database
    Database name (default: pms)
    
.PARAMETER Username
    MySQL username (default: pms)
    
.PARAMETER Password
    MySQL password (default: pms)
    
.PARAMETER S3Bucket
    S3 bucket name (default: pms-backups-dynamics)
    
.PARAMETER S3Region
    AWS region (default: us-east-1)

.EXAMPLE
    .\backup-mysql-s3.ps1
    # Uses defaults and environment variables for AWS credentials
#>

param(
    [string]$ComposeFile = "$(Join-Path $PSScriptRoot '..\docker-compose.yml')",
    [string]$Database = 'pms',
    [string]$Username = 'pms',
    [string]$Password = 'pms',
    [string]$S3Bucket = 'pms-backups-dynamics',
    [string]$S3Region = 'us-east-1'
)

# Verify prerequisites
if (-not (Test-Path $ComposeFile)) {
    Write-Host "ERROR: docker-compose file not found: $ComposeFile" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Docker CLI is not available in PATH" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: AWS CLI is not installed" -ForegroundColor Red
    Write-Host "Download from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "PMS Digital Dynamics - S3 Backup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Generate timestamp
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$dateFolder = Get-Date -Format 'yyyy/MM/dd'
$tempBackupFile = Join-Path $env:TEMP "pms_$timestamp.sql"

Write-Host "Database: $Database" -ForegroundColor Green
Write-Host "S3 Bucket: $S3Bucket" -ForegroundColor Green
Write-Host "Region: $S3Region" -ForegroundColor Green
Write-Host ""

# Step 1: Create MySQL backup
Write-Host "Step 1: Creating MySQL backup..." -ForegroundColor Yellow

docker compose -f $ComposeFile exec -T mysql mysqldump `
    -u$Username `
    -p$Password `
    --single-transaction `
    --quick `
    --routines `
    --triggers `
    --events `
    $Database > $tempBackupFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: mysqldump failed" -ForegroundColor Red
    Write-Host "- Verify Docker containers are running: docker compose ps" -ForegroundColor Yellow
    Write-Host "- Check MySQL credentials in docker-compose.yml" -ForegroundColor Yellow
    exit 1
}

$backupSize = (Get-Item $tempBackupFile).Length
$backupSizeMB = $backupSize / 1MB

Write-Host "✅ Backup created successfully" -ForegroundColor Green
Write-Host "   File: $tempBackupFile" -ForegroundColor Green
Write-Host "   Size: $($backupSizeMB.ToString('F2')) MB" -ForegroundColor Green
Write-Host ""

# Step 2: Calculate SHA256 checksum
Write-Host "Step 2: Calculating checksum..." -ForegroundColor Yellow

$fileHash = (Get-FileHash -Path $tempBackupFile -Algorithm SHA256).Hash
$checksumFile = "$tempBackupFile.sha256"
Set-Content -Path $checksumFile -Value "$fileHash  pms_$timestamp.sql"

Write-Host "✅ Checksum calculated" -ForegroundColor Green
Write-Host "   SHA256: $fileHash" -ForegroundColor Green
Write-Host ""

# Step 3: Upload to S3
Write-Host "Step 3: Uploading to AWS S3..." -ForegroundColor Yellow

$s3Key = "backups/$dateFolder/pms_$timestamp.sql"

try {
    aws s3 cp $tempBackupFile "s3://$S3Bucket/$s3Key" `
        --region $S3Region `
        --sse AES256 `
        --storage-class STANDARD_IA

    if ($LASTEXITCODE -ne 0) {
        throw "AWS CLI returned error code: $LASTEXITCODE"
    }

    Write-Host "✅ Backup uploaded to S3" -ForegroundColor Green
    Write-Host "   S3 Path: s3://$S3Bucket/$s3Key" -ForegroundColor Green

} catch {
    Write-Host "ERROR: Failed to upload backup to S3" -ForegroundColor Red
    Write-Host "   $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Verify AWS credentials: aws sts get-caller-identity" -ForegroundColor Yellow
    Write-Host "2. Check S3 bucket exists: aws s3 ls s3://$S3Bucket" -ForegroundColor Yellow
    Write-Host "3. Verify bucket permissions for your AWS user" -ForegroundColor Yellow
    exit 1
}

# Step 4: Upload checksum
Write-Host "Step 4: Uploading checksum file..." -ForegroundColor Yellow

aws s3 cp $checksumFile "s3://$S3Bucket/$s3Key.sha256" `
    --region $S3Region

Write-Host "✅ Checksum uploaded" -ForegroundColor Green
Write-Host ""

# Step 5: Verify upload
Write-Host "Step 5: Verifying upload..." -ForegroundColor Yellow

try {
    aws s3 ls "s3://$S3Bucket/$s3Key" --region $S3Region | Out-Null
    Write-Host "✅ File verified in S3" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Warning: Could not verify file in S3" -ForegroundColor Yellow
}

Write-Host ""

# Cleanup local temp files
Write-Host "Step 6: Cleanup..." -ForegroundColor Yellow

Remove-Item $tempBackupFile -ErrorAction SilentlyContinue
Remove-Item $checksumFile -ErrorAction SilentlyContinue

Write-Host "✅ Temporary files cleaned up" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "=====================================" -ForegroundColor Green
Write-Host "BACKUP COMPLETED SUCCESSFULLY" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backup Details:" -ForegroundColor Cyan
Write-Host "  Database: $Database" -ForegroundColor Cyan
Write-Host "  Timestamp: $timestamp" -ForegroundColor Cyan
Write-Host "  Size: $($backupSizeMB.ToString('F2')) MB" -ForegroundColor Cyan
Write-Host "  S3 Bucket: $S3Bucket" -ForegroundColor Cyan
Write-Host "  S3 Path: s3://$S3Bucket/$s3Key" -ForegroundColor Cyan
Write-Host "  SHA256: $fileHash" -ForegroundColor Cyan
Write-Host ""

Write-Host "To retrieve this backup, use:" -ForegroundColor Yellow
Write-Host "  aws s3 cp s3://$S3Bucket/$s3Key ./pms_backup.sql --region $S3Region" -ForegroundColor Gray
Write-Host ""
