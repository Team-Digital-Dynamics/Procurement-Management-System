#!/usr/bin/env powershell
Set-StrictMode -Version Latest

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "PMS S3 Backup Test" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$S3Bucket = 'pms-backups-dynamics'
$S3Region = 'us-east-1'
$BackupDir = (Get-Item (Split-Path -Parent $PSScriptRoot)).FullName + '\backups'

# Create backup directory
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

# Create test backup file
$Timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$TestFile = "$BackupDir\pms_backup_test_$Timestamp.sql"

$TestContent = @"
-- PMS Database Backup Test
-- Created: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')
-- Account: admindigitaldynamics@gmail.com
--
-- This is a test backup to verify S3 connectivity

SELECT 'PMS Backup Test' as 'Status', NOW() as 'Timestamp';
"@

Set-Content -Path $TestFile -Value $TestContent -Encoding UTF8
$FileSize = (Get-Item $TestFile).Length

Write-Host "✅ Test backup file created" -ForegroundColor Green
Write-Host ""
Write-Host "File Details:" -ForegroundColor Cyan
Write-Host "  Location: $TestFile" -ForegroundColor Cyan
Write-Host "  Size: $FileSize bytes" -ForegroundColor Cyan
Write-Host ""

# Calculate checksum
$Checksum = (Get-FileHash -Path $TestFile -Algorithm SHA256).Hash
Write-Host "✅ Checksum: $Checksum" -ForegroundColor Green
Write-Host ""

# Generate S3 path
$S3Date = Get-Date -Format 'yyyy/MM/dd'
$S3FileName = Split-Path -Leaf $TestFile
$S3Key = "backups/$S3Date/$S3FileName"

Write-Host "S3 Upload Details:" -ForegroundColor Cyan
Write-Host "  Bucket: $S3Bucket" -ForegroundColor Cyan
Write-Host "  Region: $S3Region" -ForegroundColor Cyan
Write-Host "  Key: $S3Key" -ForegroundColor Cyan
Write-Host ""

# Try to upload using AWS CLI
Write-Host "Attempting upload with AWS CLI..." -ForegroundColor Yellow

# Refresh PATH to pick up AWS CLI
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Set AWS credentials in environment
$CredFile = "$env:USERPROFILE\.aws\credentials"
if (Test-Path $CredFile) {
    $CredContent = Get-Content $CredFile -Raw
    if ($CredContent -match 'aws_access_key_id\s*=\s*(.+)') {
        $env:AWS_ACCESS_KEY_ID = $matches[1].Trim()
    }
    if ($CredContent -match 'aws_secret_access_key\s*=\s*(.+)') {
        $env:AWS_SECRET_ACCESS_KEY = $matches[1].Trim()
    }
    $env:AWS_DEFAULT_REGION = $S3Region
    Write-Host "✓ AWS credentials configured from ~/.aws/credentials" -ForegroundColor Green
}

Write-Host ""

# Try different ways to find and run AWS CLI
$AwsFound = $false

# Method 1: Try direct command
try {
    $AwsVersion = & aws --version 2>&1
    if ($AwsVersion -like "*aws-cli*") {
        Write-Host "✓ AWS CLI found: $AwsVersion" -ForegroundColor Green
        $AwsFound = $true
    }
} catch {}

# Method 2: Try Program Files path
if (-not $AwsFound) {
    $AwsPath = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"
    if (Test-Path $AwsPath) {
        $AwsVersion = & $AwsPath --version 2>&1
        Write-Host "✓ AWS CLI found at: $AwsPath" -ForegroundColor Green
        $AwsFound = $true
    }
}

if ($AwsFound) {
    Write-Host "Uploading to S3..." -ForegroundColor Yellow
    Write-Host ""
    
    try {
        & aws s3 cp $TestFile "s3://$S3Bucket/$S3Key" --sse AES256 --storage-class STANDARD_IA --region $S3Region
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "╔════════════════════════════════════╗" -ForegroundColor Green
            Write-Host "║ ✅ SUCCESS! Backup in S3           ║" -ForegroundColor Green
            Write-Host "╚════════════════════════════════════╝" -ForegroundColor Green
            Write-Host ""
            Write-Host "Your backup file is now in AWS S3:" -ForegroundColor Green
            Write-Host "  s3://$S3Bucket/$S3Key" -ForegroundColor Green
            Write-Host ""
            Write-Host "Verify in AWS Console:" -ForegroundColor Yellow
            Write-Host "  1. Go to: https://console.aws.amazon.com/s3/" -ForegroundColor Yellow
            Write-Host "  2. Click bucket: $S3Bucket" -ForegroundColor Yellow
            Write-Host "  3. Open folder: backups/$S3Date/" -ForegroundColor Yellow
            Write-Host "  4. You'll see: $S3FileName" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Next Step:" -ForegroundColor Cyan
            Write-Host "  Run the scheduled task setup to automate daily backups" -ForegroundColor Cyan
            Write-Host "  File: RUN-SETUP-AS-ADMIN.bat" -ForegroundColor Cyan
            Write-Host ""
        } else {
            Write-Host "Upload failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        }
    } catch {
        Write-Host "ERROR: $_" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "AWS CLI not yet available. Installation in progress..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Once AWS CLI installs, copy and run this command:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "aws s3 cp `"$TestFile`" s3://$S3Bucket/$S3Key --sse AES256 --storage-class STANDARD_IA" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or upload through AWS Console:" -ForegroundColor Yellow
    Write-Host "  1. Go to: https://console.aws.amazon.com/s3/" -ForegroundColor Yellow
    Write-Host "  2. Click: $S3Bucket" -ForegroundColor Yellow
    Write-Host "  3. Create folder: backups/$S3Date" -ForegroundColor Yellow
    Write-Host "  4. Upload: $TestFile" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
