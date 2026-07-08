package com.digitaldynamics.pms.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

public final class BackupDtos {
    private BackupDtos() {
    }

    public record BackupResult(
            String fileName,
            String checksum,
            long sizeBytes,
            int tableCount,
            long rowCount,
            Instant createdAt,
            String source
    ) {
    }

    public record BackupSummary(
            String fileName,
            String checksum,
            long sizeBytes,
            Instant createdAt
    ) {
    }

    public record RestoreRequest(@NotBlank String fileName) {
    }

    public record RestoreResult(
            String fileName,
            String checksum,
            Instant restoredAt,
            int statementsExecuted
    ) {
    }
}
