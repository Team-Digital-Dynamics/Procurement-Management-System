package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.dto.AuthDtos.AuthResponse;
import com.digitaldynamics.pms.dto.LoginRequest;
import com.digitaldynamics.pms.dto.AuthDtos.RegisterRequest;
import com.digitaldynamics.pms.dto.LoginResponse;
import com.digitaldynamics.pms.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.digitaldynamics.pms.dto.AuthDtos.MessageResponse;
import com.digitaldynamics.pms.dto.AuthDtos.ResetPasswordRequest;

@RestController
@RequestMapping({"/api/v1/auth", "/api/auth"})
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request,
                                               HttpServletRequest httpServletRequest) {
        String ipAddress = clientIpAddress(httpServletRequest);
        LoginResponse response = authService.login(request.getEmail(), request.getPassword(), ipAddress);
        return ResponseEntity.ok(response);
    }

    private String clientIpAddress(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @PostMapping("/reset-password")
    MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return authService.resetPassword(request);
    }
}
