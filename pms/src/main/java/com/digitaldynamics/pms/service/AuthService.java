package com.digitaldynamics.pms.service;

import com.digitaldynamics.pms.dto.AuthDtos.AuthResponse;
import com.digitaldynamics.pms.dto.LoginRequest;
import com.digitaldynamics.pms.dto.LoginResponse;
import com.digitaldynamics.pms.dto.AuthDtos.RegisterRequest;
import com.digitaldynamics.pms.exception.AccountLockedException;
import com.digitaldynamics.pms.exception.ApiException;
import com.digitaldynamics.pms.exception.InvalidCredentialsException;
import com.digitaldynamics.pms.model.AccountStatus;
import com.digitaldynamics.pms.model.Role;
import com.digitaldynamics.pms.model.User;
import com.digitaldynamics.pms.repository.UserRepository;
import com.digitaldynamics.pms.security.JwtService;
import com.digitaldynamics.pms.dto.AuthDtos.MessageResponse;
import com.digitaldynamics.pms.dto.AuthDtos.ResetPasswordRequest;
import java.util.LinkedHashSet;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private static final Logger LOG = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService auditService;

    public AuthService(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder, JwtService jwtService,
                       AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditService = auditService;
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Passwords do not match");
        }

        User user = userRepository.findByEmail(request.email().toLowerCase())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account not found"));

        if (user.getStatus() == AccountStatus.INACTIVE) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Account is still pending administrator approval");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setFailedLoginAttempts(0);

        if (user.getStatus() == AccountStatus.LOCKED) {
            user.setStatus(AccountStatus.ACTIVE);
        }

        auditService.record(user.getEmail(), "RESET_PASSWORD", "User", user.getId(), "Password reset completed");

        return new MessageResponse("Password reset successfully. You can now sign in with your new password.");
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
        user.setStatus(AccountStatus.INACTIVE);
        user.setRole(Role.REQUESTOR);
        userRepository.save(user);
        auditService.record(user.getEmail(), "REGISTER", "User", user.getId(), "User registered and awaits activation");
        return response(user);
    }

    @Transactional
    public LoginResponse login(String email, String rawPassword, String ipAddress) {
        String normalizedEmail = email == null ? "" : email.toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> {
                    LOG.warn("Anonymous login failure for email={} from ip={}", normalizedEmail, ipAddress);
                    throw new InvalidCredentialsException("Invalid credentials");
                });

        if (user.getStatus() == AccountStatus.LOCKED) {
            throw new AccountLockedException("Account is locked");
        }

        if (passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            user.setFailedLogins(0);
            userRepository.save(user);
            return new LoginResponse(
                    jwtService.create(user),
                    user.getEmail(),
                    user.getFullName(),
                    roleNames(user)
            );
        }

        int failed = user.getFailedLogins() + 1;
        user.setFailedLogins(failed);
        if (failed >= 5) {
            user.setStatus(AccountStatus.LOCKED);
        }
        userRepository.save(user);
        throw new InvalidCredentialsException("Invalid credentials");
    }

    @Transactional
    public LoginResponse login(LoginRequest request, String ipAddress) {
        return login(request.email(), request.password(), ipAddress);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        LoginResponse loginResponse = login(request, "unknown");
        User user = userRepository.findByEmail(loginResponse.email())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        return response(user);
    }

    private Set<String> roleNames(User user) {
        Set<String> roles = new LinkedHashSet<>();
        if (user.getRole() != null) {
            roles.add(user.getRole().name());
        }
        user.getRoles().forEach(role -> roles.add(role.name()));
        return roles;
    }

    private AuthResponse response(User user) {
        return new AuthResponse(jwtService.create(user), user.getId(), user.getEmail(), user.getFullName(),
                user.getRoles());
    }
}
