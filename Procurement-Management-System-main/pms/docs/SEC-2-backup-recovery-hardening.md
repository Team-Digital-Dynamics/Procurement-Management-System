# SEC-2: Backup, Recovery and Hardening

This document provides an auditable implementation for Sprint 5 item SEC-2.

## Scope

- Daily MySQL logical backup (`mysqldump`).
- Recovery procedure with verification steps.
- Final security review checklist across core modules.

## Files Added

- `scripts/backup-mysql.ps1`
- `scripts/restore-mysql.ps1`

## Daily Backup Procedure

Run from the `pms` folder:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup-mysql.ps1
```

Output:

- SQL dump in `backups/` with timestamp.
- SHA256 checksum file per backup.
- Automatic retention cleanup (default: 14 days).

### Windows Task Scheduler (Daily 01:00)

Create a scheduled task that runs:

Program/script:

```text
powershell.exe
```

Arguments:

```text
-ExecutionPolicy Bypass -File "C:\path\to\pms\scripts\backup-mysql.ps1"
```

Start in:

```text
C:\path\to\pms
```

Recommended task settings:

- Run whether user is logged on or not.
- Retry on failure (3 retries, 5-minute delay).
- Stop task if running longer than 30 minutes.

## Recovery Procedure (Tested Runbook)

1. Ensure Docker services are up.

```powershell
docker compose up -d
```

2. Run restore with a selected SQL backup.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\restore-mysql.ps1 -BackupFile .\backups\pms_YYYYMMDD_HHMMSS.sql -CreateSafetyBackup
```

3. Validate recovery.

```powershell
docker compose exec -T mysql mysql -upms -ppms -D pms -e "SHOW TABLES;"
```

4. Validate application health.

```powershell
curl http://localhost:8080/actuator/health
```

5. Validate business smoke path:

- Log in with seeded account.
- Create and submit one requisition.
- Confirm audit record creation.

## Final Security Review Checklist (All Core Modules)

Status values: `PASS`, `FAIL`, `N/A`.

### Authentication and Session Security

- [ ] JWT secret is overridden in non-dev environments (`PMS_JWT_SECRET`) - PASS/FAIL
- [ ] Default seeded passwords are changed in production - PASS/FAIL
- [ ] Token expiry configured and documented - PASS/FAIL

### Authorization and RBAC

- [ ] Role-based endpoint restrictions validated for admin/procurement/requester/approver/receiving - PASS/FAIL
- [ ] Privilege escalation checks for all protected routes - PASS/FAIL

### Input Validation and API Safety

- [ ] Request DTO validation returns safe errors for bad input - PASS/FAIL
- [ ] No sensitive stack traces or secrets returned to clients - PASS/FAIL

### Data Protection and Storage

- [ ] Passwords stored using BCrypt only - PASS/FAIL
- [ ] Least-privilege database credentials used by app - PASS/FAIL
- [ ] Backups encrypted or protected at rest by infrastructure policy - PASS/FAIL

### Auditability and Non-Repudiation

- [ ] Security-sensitive actions are audit logged - PASS/FAIL
- [ ] Audit logs are immutable by normal users - PASS/FAIL

### Dependency and Runtime Hardening

- [ ] Maven dependencies scanned for CVEs (high/critical resolved) - PASS/FAIL
- [ ] Container image pinned and regularly patched - PASS/FAIL
- [ ] Management endpoints exposure restricted to required endpoints only - PASS/FAIL

### Module Coverage Confirmation

- [ ] User and Auth module reviewed - PASS/FAIL
- [ ] Requisition and Approval module reviewed - PASS/FAIL
- [ ] RFQ and Quotation module reviewed - PASS/FAIL
- [ ] Evaluation and Award module reviewed - PASS/FAIL
- [ ] Purchase Order and GRN module reviewed - PASS/FAIL
- [ ] Audit module reviewed - PASS/FAIL

## Evidence to Store for Sprint Sign-off

- Backup job screenshot/log for at least 2 consecutive days.
- One successful recovery test log with timestamp and operator.
- Completed checklist with reviewer name and date.
- Any identified risks and remediation tickets.

## Notes

- Current `docker-compose.yml` uses inline credentials for local development.
- For production, move database and JWT secrets to a secure secret store and rotate them regularly.
