package com.digitaldynamics.pms.service;

import com.digitaldynamics.pms.dto.UserProfileUpdateDTO;
import com.digitaldynamics.pms.dto.UserRegistrationDTO;
import com.digitaldynamics.pms.dto.UserDtos.AssignRolesRequest;
import com.digitaldynamics.pms.dto.UserDtos.ProfileUpdateRequest;
import com.digitaldynamics.pms.dto.UserDtos.UserResponse;
import com.digitaldynamics.pms.exception.ApiException;
import com.digitaldynamics.pms.exception.EmailAlreadyExistsException;
import com.digitaldynamics.pms.exception.ResourceNotFoundException;
import com.digitaldynamics.pms.model.AccountStatus;
import com.digitaldynamics.pms.model.User;
import com.digitaldynamics.pms.repository.UserRepository;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

@Service
@Validated
public class UserService {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public UserService(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder, AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Transactional
    public User registerUser(@Valid UserRegistrationDTO dto) {
        String normalizedEmail = dto.getEmail().toLowerCase();
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new EmailAlreadyExistsException("Email already exists");
        }

        User user = new User();
        user.setFullName(dto.getFullName());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        user.setRole(dto.getRole());
        user.setStatus(AccountStatus.ACTIVE);
        user.setFailedLogins(0);
        user.setDepartment(dto.getDepartment());
        user.setJobTitle(dto.getJobTitle());
        return userRepository.save(user);
    }

    @Transactional
    public User updateUserProfile(Long userId, @Valid UserProfileUpdateDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setFullName(dto.getFullName());
        user.setDepartment(dto.getDepartment());
        user.setJobTitle(dto.getJobTitle());
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> all() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public UserResponse findProfile(Long id) {
        return toResponse(find(id));
    }

    @Transactional
    public UserResponse assign(Long id, AssignRolesRequest request, String actor) {
        User user = find(id);
        if (request.roles() != null && !request.roles().isEmpty()) {
            user.setRoles(request.roles());
        }
        if (request.approvalLimit() != null) {
            user.setApprovalLimit(request.approvalLimit());
        }
        if (request.status() != null) {
            user.setStatus(request.status());
        }
        auditService.logEvent(actor, "ASSIGN_ROLES", "User", String.valueOf(id),
            "Roles/status/approval limit updated");
        return toResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(Long id, ProfileUpdateRequest request, String actor) {
        User user = find(id);
        user.setFullName(request.fullName());
        user.setEmail(request.email().toLowerCase());
        auditService.logEvent(actor, "UPDATE_PROFILE", "User", String.valueOf(id), "Profile updated");
        return toResponse(user);
    }

    public User find(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    public UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getFullName(), user.getStatus(),
                user.getApprovalLimit(), user.getRoles());
    }
}
