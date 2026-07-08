package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.dto.ApiResponse;
import com.digitaldynamics.pms.dto.BackupDtos.BackupResult;
import com.digitaldynamics.pms.dto.BackupDtos.BackupSummary;
import com.digitaldynamics.pms.dto.BackupDtos.RestoreRequest;
import com.digitaldynamics.pms.dto.BackupDtos.RestoreResult;
import com.digitaldynamics.pms.security.CurrentUser;
import com.digitaldynamics.pms.service.AuditService;
import com.digitaldynamics.pms.service.DatabaseBackupService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/backups")
public class BackupController {
    private final DatabaseBackupService backupService;
    private final AuditService auditService;

    public BackupController(DatabaseBackupService backupService, AuditService auditService) {
        this.backupService = backupService;
        this.auditService = auditService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<List<BackupSummary>> listBackups() {
        return ApiResponse.success(backupService.listBackups(), "Backups loaded");
    }

    @PostMapping("/manual")
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<BackupResult> manualBackup(@AuthenticationPrincipal CurrentUser user) {
        String actor = actor(user);
        BackupResult result = backupService.createBackup("MANUAL");
        auditService.logEvent(actor, "MANUAL_BACKUP", "DatabaseBackup", result.fileName(),
                "Manual database backup completed with checksum " + result.checksum());
        return ApiResponse.success(result, "Manual backup successful");
    }

    @PostMapping("/restore")
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<RestoreResult> restoreBackup(@Valid @RequestBody RestoreRequest request,
                                             @AuthenticationPrincipal CurrentUser user) {
        String actor = actor(user);
        RestoreResult result = backupService.restoreBackup(request.fileName());
        auditService.logEvent(actor, "RESTORE_BACKUP", "DatabaseBackup", result.fileName(),
                "Database restored from verified backup checksum " + result.checksum());
        return ApiResponse.success(result, "Restore backup successful");
    }

    private String actor(CurrentUser user) {
        return user == null ? "UNKNOWN" : user.email();
    }
}
