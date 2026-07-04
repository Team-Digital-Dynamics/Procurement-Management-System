@echo off
REM Run-as-Administrator wrapper for S3 backup schedule setup

cd /d "%~dp0..\.."

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -Command \"^& {' + ^
  '[System.Reflection.Assembly]::LoadWithPartialName(''System.Windows.Forms'') | Out-Null; ' + ^
  '$TaskName = ''PMS-Daily-Backup-S3''; ' + ^
  '$BackupScript = ''%CD%\scripts\backup-mysql-s3.ps1''; ' + ^
  '$ScheduleTime = ''01:00''; ' + ^
  'Write-Host ''Creating scheduled task...'' -ForegroundColor Yellow; ' + ^
  '$action = New-ScheduledTaskAction -Execute ''powershell.exe'' -Argument ''-ExecutionPolicy Bypass -NoProfile -File \"\"%CD%\scripts\backup-mysql-s3.ps1\"\"''; ' + ^
  '$trigger = New-ScheduledTaskTrigger -Daily -At $ScheduleTime; ' + ^
  '$principal = New-ScheduledTaskPrincipal -UserID ''NT AUTHORITY\SYSTEM'' -RunLevel Highest; ' + ^
  '$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -StartWhenAvailable:$true -ExecutionTimeLimit (New-TimeSpan -Minutes 30); ' + ^
  '$task = New-ScheduledTask -Action $action -Trigger $trigger -Principal $principal -Settings $settings; ' + ^
  'Register-ScheduledTask -TaskName $TaskName -InputObject $task -Force; ' + ^
  'Write-Host ''SUCCESS: Daily S3 backup scheduled!'' -ForegroundColor Green; ' + ^
  '}'''" -Verb RunAs

pause
