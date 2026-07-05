package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.dto.AuthDtos.AuthResponse;
import com.digitaldynamics.pms.model.User;
import com.digitaldynamics.pms.repository.UserRepository;
import com.digitaldynamics.pms.security.JwtService;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Debug controller for testing - allows login without password validation
 */
@RestController
@RequestMapping("/api/debug")
public class DebugController {
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public DebugController(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @PostMapping("/login-bypass")
    public ResponseEntity<Map<String, Object>> debugLogin(@RequestParam String email) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            User user = userRepository.findByEmail(email.toLowerCase())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            AuthResponse authResp = new AuthResponse(
                jwtService.create(user),
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRoles()
            );
            
            response.put("status", "success");
            response.put("token", authResp.token());
            response.put("email", authResp.email());
            response.put("roles", authResp.roles());
            response.put("message", "Debug login successful - Token generated");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}
