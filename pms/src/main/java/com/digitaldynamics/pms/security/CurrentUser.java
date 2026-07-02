package com.digitaldynamics.pms.security;

import com.digitaldynamics.pms.model.UserRole;
import java.util.Set;

public record CurrentUser(Long id, String email, String fullName, Set<UserRole> roles) {
    public boolean hasRole(UserRole role) {
        return roles.contains(role);
    }
}
