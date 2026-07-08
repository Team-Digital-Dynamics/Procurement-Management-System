package com.digitaldynamics.pms.scheduler;

import com.digitaldynamics.pms.config.BackupProperties;
import com.digitaldynamics.pms.dto.BackupDtos.BackupResult;
import com.digitaldynamics.pms.service.AuditService;
import com.digitaldynamics.pms.service.DatabaseBackupService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class DatabaseBackupJob {
    private static final String SYSTEM_ACTOR = "SYSTEM";

    private final DatabaseBackupService backupService;
    private final BackupProperties properties;
    private final AuditService auditService;

    public DatabaseBackupJob(DatabaseBackupService backupService, BackupProperties properties, AuditService auditService) {
        this.backupService = backupService;
        this.properties = properties;
        this.auditService = auditService;
    }

    @Scheduled(cron = "${pms.backup.cron:0 0 2 * * *}")
    public void createScheduledBackup() {
        if (!properties.isScheduledEnabled()) {
            return;
        }
        BackupResult result = backupService.createBackup("SCHEDULED");
        auditService.logEvent(SYSTEM_ACTOR, "SCHEDULED_BACKUP", "DatabaseBackup", result.fileName(),
                "Scheduled database backup completed with checksum " + result.checksum());
    }
}
