package com.digitaldynamics.pms.dto;

import com.digitaldynamics.pms.model.UserRole;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

public final class ApprovalThresholdDtos {
    private ApprovalThresholdDtos() {
    }

    public record ApprovalThresholdResponse(
            Long id,
            int level,
            UserRole role,
            BigDecimal minAmount,
            BigDecimal maxAmount,
            String description,
            Instant createdAt,
            Instant updatedAt) {
    }

    public record ApprovalThresholdRequest(
            @Min(1) @Max(3) int level,
            @NotNull UserRole role,
            @NotNull @DecimalMin("0.00") BigDecimal minAmount,
            @DecimalMin("0.00") BigDecimal maxAmount,
            String description) {
    }
}