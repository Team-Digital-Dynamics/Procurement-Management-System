#!/usr/bin/env powershell
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host "PMS S3 Backup Test - Direct Upload" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

# Configuration
$S3Bucket = 'pms-backups-dynamics'
$S3Region = 'us-east-1'
$S3Host = "$S3Bucket.s3.$S3Region.amazonaws.com"
$BackupDir = (Get-Item (Split-Path -Parent $PSScriptRoot)).FullName + '\backups'

# Create backup directory
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

# Read AWS credentials
$CredFile = "$env:USERPROFILE\.aws\credentials"
if (-not (Test-Path $CredFile)) {
    Write-Host "ERROR: AWS credentials not found" -ForegroundColor Red
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

Write-Host "✓ AWS credentials loaded" -ForegroundColor Green

# Create test backup file
$Timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$TestFile = "$BackupDir\pms_backup_test_$Timestamp.sql"
$TestContent = @"
-- PMS Database Backup Test
-- Created: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')
-- Account: admindigitaldynamics@gmail.com
-- Bucket: $S3Bucket

CREATE DATABASE IF NOT EXISTS \`pms\`;
USE \`pms\`;

CREATE TABLE IF NOT EXISTS \`test_backup\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
  \`status\` varchar(50),
  PRIMARY KEY (\`id\`)
);

INSERT INTO \`test_backup\` (status) VALUES ('Backup test successful');

-- Backup verified at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')
"@

Set-Content -Path $TestFile -Value $TestContent -Encoding UTF8
$FileSize = (Get-Item $TestFile).Length

Write-Host "✓ Test backup file created" -ForegroundColor Green
Write-Host "  File: $(Split-Path -Leaf $TestFile)" -ForegroundColor Cyan
Write-Host "  Size: $FileSize bytes" -ForegroundColor Cyan
Write-Host ""

# Calculate checksum
$FileBytes = [System.IO.File]::ReadAllBytes($TestFile)
$Checksum = (Get-FileHash -Path $TestFile -Algorithm SHA256).Hash
Write-Host "✓ SHA256: $Checksum" -ForegroundColor Cyan
Write-Host ""

# Generate S3 path
$S3Date = Get-Date -Format 'yyyy/MM/dd'
$S3FileName = Split-Path -Leaf $TestFile
$S3Key = "backups/$S3Date/$S3FileName"

Write-Host "Preparing S3 upload..." -ForegroundColor Yellow
Write-Host "  Bucket: $S3Bucket" -ForegroundColor Cyan
Write-Host "  Path: $S3Key" -ForegroundColor Cyan
Write-Host "  Region: $S3Region" -ForegroundColor Cyan
Write-Host ""

# Generate AWS Signature V4
function Get-AWS-Signature {
    param(
        [string]$AccessKey,
        [string]$SecretKey,
        [string]$Method,
        [string]$CanonicalURI,
        [string]$Payload,
        [string]$Region,
        [string]$Service = 's3'
    )
    
    $Date = Get-Date -AsUTC -Format 'yyyyMMddTHHmmssZ'
    $DateStamp = Get-Date -AsUTC -Format 'yyyyMMdd'
    
    $PayloadHash = (Get-FileHash -InputStream ([System.IO.MemoryStream]::new([System.Text.Encoding]::UTF8.GetBytes($Payload))) -Algorithm SHA256).Hash.ToLower()
    
    $CanonicalRequest = @"
$Method
$CanonicalURI

host:$S3Host
x-amz-content-sha256:$PayloadHash
x-amz-date:$Date

host;x-amz-content-sha256;x-amz-date
$PayloadHash
"@
    
    $CanonicalRequestHash = (Get-FileHash -InputStream ([System.IO.MemoryStream]::new([System.Text.Encoding]::UTF8.GetBytes($CanonicalRequest))) -Algorithm SHA256).Hash.ToLower()
    
    $StringToSign = @"
AWS4-HMAC-SHA256
$Date
$DateStamp/$Region/$Service/aws4_request
$CanonicalRequestHash
"@
    
    $kDate = [System.Text.Encoding]::UTF8.GetBytes("AWS4$SecretKey")
    $kRegion = [System.Security.Cryptography.HMACSHA256]::new($kDate).ComputeHash([System.Text.Encoding]::UTF8.GetBytes($DateStamp))
    $kService = [System.Security.Cryptography.HMACSHA256]::new($kRegion).ComputeHash([System.Text.Encoding]::UTF8.GetBytes($Service))
    $kSigning = [System.Security.Cryptography.HMACSHA256]::new($kService).ComputeHash([System.Text.Encoding]::UTF8.GetBytes("aws4_request"))
    
    $Signature = ([System.Convert]::ToBase64String([System.Security.Cryptography.HMACSHA256]::new($kSigning).ComputeHash([System.Text.Encoding]::UTF8.GetBytes($StringToSign)))).Replace("`r`n", "")
    
    return @{
        Date = $Date
        DateStamp = $DateStamp
        PayloadHash = $PayloadHash
        Signature = $Signature
    }
}

$SigData = Get-AWS-Signature -AccessKey $AccessKey -SecretKey $SecretKey -Method 'PUT' -CanonicalURI "/$S3Key" -Payload $TestContent -Region $S3Region

Write-Host "Uploading to S3..." -ForegroundColor Yellow

$Headers = @{
    'Host' = $S3Host
    'X-Amz-Date' = $SigData.Date
    'X-Amz-Content-Sha256' = $SigData.PayloadHash
    'Authorization' = "AWS4-HMAC-SHA256 Credential=$AccessKey/$($SigData.DateStamp)/$S3Region/s3/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=$($SigData.Signature)"
    'Content-Type' = 'text/plain'
}

$Uri = "https://$S3Host/$S3Key"

try {
    $Response = Invoke-WebRequest -Uri $Uri -Method PUT -Headers $Headers -Body ([System.Text.Encoding]::UTF8.GetBytes($TestContent)) -UseBasicParsing
    
    if ($Response.StatusCode -eq 200) {
        Write-Host ""
        Write-Host "✅ SUCCESS! Backup uploaded to S3" -ForegroundColor Green
        Write-Host ""
        Write-Host "Details:" -ForegroundColor Cyan
        Write-Host "  Bucket: s3://$S3Bucket" -ForegroundColor Cyan
        Write-Host "  Path: $S3Key" -ForegroundColor Cyan
        Write-Host "  File: $S3FileName" -ForegroundColor Cyan
        Write-Host "  Size: $FileSize bytes" -ForegroundColor Cyan
        Write-Host "  Checksum: $Checksum" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Verify in AWS Console:" -ForegroundColor Yellow
        Write-Host "  1. Go to: https://console.aws.amazon.com/s3/" -ForegroundColor Yellow
        Write-Host "  2. Click bucket: $S3Bucket" -ForegroundColor Yellow
        Write-Host "  3. Navigate to: backups/$S3Date/" -ForegroundColor Yellow
        Write-Host "  4. Look for: $S3FileName" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "✅ All systems ready for automated daily backups!" -ForegroundColor Green
    } else {
        Write-Host "Upload response: $($Response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERROR during upload: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install AWS CLI and run:" -ForegroundColor Yellow
    Write-Host "  msiexec /i https://awscli.amazonaws.com/AWSCLIV2.msi" -ForegroundColor Gray
    exit 1
}

Write-Host ""
