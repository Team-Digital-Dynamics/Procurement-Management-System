#!/usr/bin/env powershell
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "=====================================
" -ForegroundColor Green
Write-Host "PMS S3 Backup Test" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# Configuration
$DatabaseName = 'pms'
$S3Bucket = 'pms-backups-dynamics'
$S3Region = 'us-east-1'
$BackupDir = (Get-Item (Split-Path -Parent $PSScriptRoot)).FullName + '\backups'
$LogFile = "$BackupDir\backup-test.log"

# Create backup directory
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

# Read AWS credentials from ~/.aws/credentials
$CredFile = "$env:USERPROFILE\.aws\credentials"
if (-not (Test-Path $CredFile)) {
    Write-Host "ERROR: AWS credentials not found at $CredFile" -ForegroundColor Red
    exit 1
}

$CredContent = Get-Content $CredFile -Raw
$AccessKey = $null
$SecretKey = $null

if ($CredContent -match 'aws_access_key_id\s*=\s*(.+)') {
    $AccessKey = $matches[1].Trim()
}
if ($CredContent -match 'aws_secret_access_key\s*=\s*(.+)') {
    $SecretKey = $matches[1].Trim()
}

if (-not $AccessKey -or -not $SecretKey) {
    Write-Host "ERROR: Could not parse AWS credentials" -ForegroundColor Red
    exit 1
}

Write-Host "✓ AWS credentials loaded from ~/.aws/credentials" -ForegroundColor Green

# Set environment variables for AWS
$env:AWS_ACCESS_KEY_ID = $AccessKey
$env:AWS_SECRET_ACCESS_KEY = $SecretKey
$env:AWS_DEFAULT_REGION = $S3Region

Write-Host "✓ AWS environment configured" -ForegroundColor Green
Write-Host ""

# Try using AWS CLI first
$AwsCliPath = Get-Command aws -ErrorAction SilentlyContinue
if ($AwsCliPath) {
    Write-Host "Using AWS CLI for backup upload..." -ForegroundColor Yellow
    Write-Host ""
    
    # Create test file
    $TestFile = "$BackupDir\pms_test_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    $TestContent = "-- Test PMS Database Backup`n-- Created: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`nCREATE TABLE IF NOT EXISTS test (id INT);"
    Set-Content -Path $TestFile -Value $TestContent
    
    Write-Host "Test file created: $TestFile" -ForegroundColor Cyan
    Write-Host "File size: $(([System.IO.FileInfo]$TestFile).Length) bytes" -ForegroundColor Cyan
    Write-Host ""
    
    # Calculate checksum
    $Checksum = (Get-FileHash -Path $TestFile -Algorithm SHA256).Hash
    Write-Host "Checksum: $Checksum" -ForegroundColor Cyan
    Write-Host ""
    
    # Upload to S3
    Write-Host "Uploading to S3..." -ForegroundColor Yellow
    $S3Date = Get-Date -Format 'yyyy/MM/dd'
    $S3FileName = Split-Path -Leaf $TestFile
    $S3Path = "backups/$S3Date/$S3FileName"
    
    & aws s3 cp $TestFile "s3://$S3Bucket/$S3Path" --sse AES256 --storage-class STANDARD_IA --region $S3Region 2>&1 | Tee-Object -Variable UploadOutput
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ SUCCESS! Backup uploaded to S3" -ForegroundColor Green
        Write-Host ""
        Write-Host "Details:" -ForegroundColor Cyan
        Write-Host "  Bucket: $S3Bucket" -ForegroundColor Cyan
        Write-Host "  Path: $S3Path" -ForegroundColor Cyan
        Write-Host "  File: $S3FileName" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Verify in AWS:" -ForegroundColor Yellow
        Write-Host "  1. Go to: https://console.aws.amazon.com/s3/" -ForegroundColor Yellow
        Write-Host "  2. Click bucket: $S3Bucket" -ForegroundColor Yellow
        Write-Host "  3. Navigate to: backups/$S3Date/" -ForegroundColor Yellow
        Write-Host "  4. You should see: $S3FileName" -ForegroundColor Yellow
        Write-Host ""
    } else {
        Write-Host "❌ Upload failed" -ForegroundColor Red
        Write-Host "Output: $UploadOutput" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "AWS CLI not found. Attempting direct S3 upload with HTTP..." -ForegroundColor Yellow
    Write-Host ""
    
    # Create test file
    $TestFile = "$BackupDir\pms_test_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    $TestContent = "-- Test PMS Database Backup`n-- Created: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`nCREATE TABLE IF NOT EXISTS test (id INT);"
    Set-Content -Path $TestFile -Value $TestContent
    
    Write-Host "Test file created" -ForegroundColor Green
    Write-Host "File size: $(([System.IO.FileInfo]$TestFile).Length) bytes" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "To complete upload, please install AWS CLI:" -ForegroundColor Yellow
    Write-Host "  msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "Test backup preparation complete!" -ForegroundColor Green
Write-Host ""
