package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.dto.AuthDtos.AuthResponse;
import com.digitaldynamics.pms.dto.AuthDtos.LoginRequest;
import com.digitaldynamics.pms.dto.AuthDtos.RegisterRequest;
import com.digitaldynamics.pms.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.digitaldynamics.pms.dto.AuthDtos.MessageResponse;
import com.digitaldynamics.pms.dto.AuthDtos.ResetPasswordRequest;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/reset-password")
    MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return authService.resetPassword(request);
    }
}
