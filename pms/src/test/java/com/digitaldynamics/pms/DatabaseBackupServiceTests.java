package com.digitaldynamics.pms;

import static org.assertj.core.api.Assertions.assertThat;

import com.digitaldynamics.pms.service.DatabaseBackupService;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest(properties = "pms.backup.scheduled-enabled=false")
class DatabaseBackupServiceTests {
    private static final Path BACKUP_DIRECTORY = Path.of("backups");

    @Autowired
    DatabaseBackupService backupService;

    @Autowired
    JdbcTemplate jdbcTemplate;

    @DynamicPropertySource
    static void backupProperties(DynamicPropertyRegistry registry) {
        registry.add("pms.backup.directory", () -> BACKUP_DIRECTORY.toString());
    }

    @Test
    void manualBackupScheduledBackupAndRestoreSucceedWithChecksumIntegrity() {
        jdbcTemplate.update("UPDATE users SET full_name = ? WHERE email = ?",
                "Backup Verified Admin", "admin@digitaldynamics.co.za");

        var manualBackup = backupService.createBackup("MANUAL");
        var scheduledBackup = backupService.createBackup("SCHEDULED");

        assertThat(manualBackup.fileName()).endsWith(".sql");
        assertThat(manualBackup.checksum()).hasSize(64);
        assertThat(manualBackup.rowCount()).isPositive();
        assertThat(scheduledBackup.source()).isEqualTo("SCHEDULED");

        var verification = backupService.verifyBackup(manualBackup.fileName());
        assertThat(verification.checksumMatches()).isTrue();
        assertThat(verification.actualChecksum()).isEqualTo(manualBackup.checksum());
        assertThat(verification.statementsFound()).isPositive();
        assertThat(verification.insertStatementsFound()).isPositive();

        jdbcTemplate.update("UPDATE users SET full_name = ? WHERE email = ?",
                "Changed After Backup", "admin@digitaldynamics.co.za");

        var restore = backupService.restoreBackup(manualBackup.fileName());
        String restoredName = jdbcTemplate.queryForObject(
                "SELECT full_name FROM users WHERE email = ?",
                String.class,
                "admin@digitaldynamics.co.za");

        assertThat(restore.checksum()).isEqualTo(manualBackup.checksum());
        assertThat(restore.statementsExecuted()).isPositive();
        assertThat(restoredName).isEqualTo("Backup Verified Admin");
        assertThat(backupService.listBackups()).extracting("fileName")
                .contains(manualBackup.fileName(), scheduledBackup.fileName());
    }

}
