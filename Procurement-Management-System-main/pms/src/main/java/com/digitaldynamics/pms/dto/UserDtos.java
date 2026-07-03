package com.digitaldynamics.pms.dto;

import com.digitaldynamics.pms.model.AccountStatus;
import com.digitaldynamics.pms.model.UserRole;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.util.Set;

public final class UserDtos {
    private UserDtos() {
    }

    public record UserResponse(Long id, String email, String fullName, AccountStatus status,
                               BigDecimal approvalLimit, Set<UserRole> roles) {
    }

    public record AssignRolesRequest(Set<UserRole> roles, @DecimalMin("0.00") BigDecimal approvalLimit,
                                     AccountStatus status) {
    }

    public record ProfileUpdateRequest(@NotBlank String fullName, @Email @NotBlank String email) {
    }
}
