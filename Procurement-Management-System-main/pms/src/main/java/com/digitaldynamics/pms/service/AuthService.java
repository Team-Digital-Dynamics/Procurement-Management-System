package com.digitaldynamics.pms.service;

import com.digitaldynamics.pms.dto.AuthDtos.AuthResponse;
import com.digitaldynamics.pms.dto.AuthDtos.LoginRequest;
import com.digitaldynamics.pms.dto.AuthDtos.RegisterRequest;
import com.digitaldynamics.pms.exception.ApiException;
import com.digitaldynamics.pms.model.AccountStatus;
import com.digitaldynamics.pms.model.User;
import com.digitaldynamics.pms.model.UserRole;
import com.digitaldynamics.pms.repository.UserRepository;
import com.digitaldynamics.pms.security.JwtService;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService auditService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
                       AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditService = auditService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");
        }
        User user = new User();
        user.setEmail(request.email().toLowerCase());
        user.setFullName(request.fullName());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setStatus(AccountStatus.PENDING);
        user.setRoles(Set.of(UserRole.REQUESTER));
        userRepository.save(user);
        auditService.record(user.getEmail(), "REGISTER", "User", user.getId(), "User registered and awaits activation");
        return response(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email().toLowerCase())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (user.getStatus() != AccountStatus.ACTIVE) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Account is not active");
        }
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            int failed = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(failed);
            if (failed >= 5) {
                user.setStatus(AccountStatus.LOCKED);
                auditService.record(user.getEmail(), "LOCK_ACCOUNT", "User", user.getId(), "Account locked after failed logins");
            }
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        user.setFailedLoginAttempts(0);
        auditService.record(user.getEmail(), "LOGIN", "User", user.getId(), "User authenticated");
        return response(user);
    }

    private AuthResponse response(User user) {
        return new AuthResponse(jwtService.create(user), user.getId(), user.getEmail(), user.getFullName(), user.getRoles());
    }
}
