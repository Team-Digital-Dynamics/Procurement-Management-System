# PMS BACKUP SYSTEM - QUICK START GUIDE
## For Production Deployment & Operations

---

## ⚡ 30-Second Deployment

**On your production server, as Administrator:**

```powershell
# 1. Install AWS CLI (if not already done)
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi /qn /norestart

# 2. Configure credentials (if not already done)
aws configure
# Access Key: AKIA2G5ZTAHQ2O6CCM3V
# Secret Key: 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
# Region: us-east-1

# 3. Run deployment
cd "C:\...\pms\scripts"
.\DEPLOY-PRODUCTION-BACKUPS.bat

# Done! ✅ Backups start automatically at 01:00 AM UTC daily
```

---

## 📊 What Happens

| When | What |
|------|------|
| **Every Day 01:00 AM UTC** | Backup starts |
| **01:05** | MySQL dump created |
| **01:15** | File encrypted |
| **01:25** | Uploaded to S3 |
| **01:35** | ✅ DONE |

**Result**: File in `s3://pms-backups-dynamics/backups/2026/07/04/pms_*.sql`

---

## ✅ Verify It's Working

```powershell
# 1. Check task status
taskschd.msc
# Look for: PMS-Daily-Backup-S3
# Status: Ready ✅

# 2. Check next run time
Get-ScheduledTask -TaskName "PMS-Daily-Backup-S3" | Select NextRunTime

# 3. View logs
Get-Content "C:\...\pms\backups\backup.log" -Tail 20

# 4. List S3 backups
aws s3 ls s3://pms-backups-dynamics/backups/ --recursive
```

---

## 🆘 If Backup Fails

### Check 1: Is Docker Running?
```powershell
docker ps --filter "name=mysql"
# Should show: pms-mysql-1 running
```

### Check 2: Are AWS Credentials Valid?
```powershell
aws sts get-caller-identity
# Should show your account ID
```

### Check 3: View Error Logs
```powershell
Get-Content "C:\...\pms\backups\backup.log" | Select-String "ERROR"
```

### Check 4: Test Backup Manually
```powershell
powershell -ExecutionPolicy Bypass -NoProfile `
  -File "C:\...\pms\scripts\backup-daily-production.ps1"
```

---

## 📥 Download a Backup

```powershell
# List available backups
aws s3 ls s3://pms-backups-dynamics/backups/ --recursive

# Download specific backup
aws s3 cp s3://pms-backups-dynamics/backups/2026/07/04/pms_20260704_010000.sql .

# Download today's latest
aws s3 cp s3://pms-backups-dynamics/backups/2026/07/04/pms_*.sql . --region us-east-1
```

---

## 🔧 Common Tasks

### Run Backup Now (don't wait for 01:00 AM)
```powershell
powershell -ExecutionPolicy Bypass -NoProfile `
  -File "C:\...\pms\scripts\backup-daily-production.ps1"
```

### Disable Scheduled Backup Temporarily
```powershell
Disable-ScheduledTask -TaskName "PMS-Daily-Backup-S3"
```

### Re-enable Scheduled Backup
```powershell
Enable-ScheduledTask -TaskName "PMS-Daily-Backup-S3"
```

### See All Backups in S3
```powershell
aws s3 ls s3://pms-backups-dynamics/backups/ --recursive --human-readable
```

### Delete Old Backup (if needed)
```powershell
aws s3 rm s3://pms-backups-dynamics/backups/2026/07/01/pms_*.sql
```

---

## 📋 File Locations

| File | Location |
|------|----------|
| Main Script | `pms/scripts/backup-daily-production.ps1` |
| Deployment | `pms/scripts/DEPLOY-PRODUCTION-BACKUPS.bat` |
| Logs | `pms/backups/backup.log` |
| Documentation | `README-PRODUCTION-BACKUPS.md` |
| AWS Creds | `~/.aws/credentials` |

---

## 🚨 Emergency Restore

### If you need to restore from a backup:

```powershell
# 1. Download backup
aws s3 cp s3://pms-backups-dynamics/backups/2026/07/04/pms_20260704_010000.sql backup.sql

# 2. Restore to MySQL
docker exec pms-mysql-1 mysql -u root -proot < backup.sql

# 3. Verify
docker exec pms-mysql-1 mysql -u root -proot -e "SELECT COUNT(*) FROM pms.users;"
```

---

## 💰 Costs

| Item | Cost |
|------|------|
| Per day backup (~2.5 MB) | $0.01 |
| Monthly (~75 MB) | ~$0.50 |
| AWS data transfer | $0.00 (S3 region) |
| **Total monthly** | **~$0.50-1.00** |

---

## 🎯 Key Points

✅ Completely automatic - no intervention needed  
✅ Runs at 01:00 AM UTC every day  
✅ Encrypted with AES256  
✅ Stored in AWS S3 `pms-backups-dynamics`  
✅ Organized by date for easy retrieval  
✅ Full database backup (all tables, procedures)  
✅ Very low cost (~$0.50/month)  

---

## 📞 Support

- **Full guide**: `README-PRODUCTION-BACKUPS.md`
- **Setup help**: `pms/docs/BACKUP-SETUP.md`
- **AWS Console**: https://console.aws.amazon.com/s3/
- **Logs**: `pms/backups/backup.log`

---

## 🔐 Security

- Access Key stored locally only
- Secret Key never in code or version control
- Backups encrypted with AES256
- AWS IAM restricts keys to S3 only
- All attempts logged for audit

---

**Print this guide and post it where your ops team can see it!**

---

**Status**: ✅ Production Ready  
**Account**: admindigitaldynamics@gmail.com  
**Bucket**: pms-backups-dynamics  
**Schedule**: Daily 01:00 AM UTC
