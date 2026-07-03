package com.digitaldynamics.pms.dto;

import com.digitaldynamics.pms.model.AccountStatus;
import java.time.LocalDateTime;
import java.util.Set;

public record UserResponse(
        Long userId,
        String email,
        String fullName,
        Set<String> roles,
        String department,
        String jobTitle,
        AccountStatus status,
        int failedLogins,
        LocalDateTime createdDate
) {
}
