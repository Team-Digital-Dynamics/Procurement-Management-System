package com.digitaldynamics.pms.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password
) {
        public String getEmail() {
                return email;
        }

        public String getPassword() {
                return password;
        }
}
