package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.model.AccountStatus;
import com.digitaldynamics.pms.model.User;
import com.digitaldynamics.pms.model.UserRole;
import com.digitaldynamics.pms.repository.UserRepository;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/init")
@CrossOrigin(origins = "*")
public class InitController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public InitController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/setup-admin")
    public ResponseEntity<Map<String, String>> setupAdmin() {
        Map<String, String> response = new HashMap<>();
        
        try {
            // Delete existing test user
            userRepository.findByEmail("admin@digitaldynamics.co.za").ifPresent(userRepository::delete);
            
            // Create new admin user
            User admin = new User();
            admin.setEmail("admin@digitaldynamics.co.za");
            admin.setFullName("System Admin");
            admin.setPasswordHash(passwordEncoder.encode("Admin@123456"));
            admin.setStatus(AccountStatus.ACTIVE);
            admin.setRoles(Set.of(UserRole.ADMIN));
            admin.setFailedLoginAttempts(0);
            admin.setApprovalLimit(new java.math.BigDecimal("999999"));
            
            userRepository.save(admin);
            
            response.put("status", "success");
            response.put("email", "admin@digitaldynamics.co.za");
            response.put("password", "Admin@123456");
            response.put("message", "Admin user created successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}
