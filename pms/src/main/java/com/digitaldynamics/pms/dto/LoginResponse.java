package com.digitaldynamics.pms.dto;

import java.util.Set;

public record LoginResponse(
        String token,
        String email,
        String fullName,
        Set<String> roles
) {
}
