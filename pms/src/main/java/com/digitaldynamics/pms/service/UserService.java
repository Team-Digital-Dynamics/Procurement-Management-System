package com.digitaldynamics.pms.service;

import com.digitaldynamics.pms.dto.UserDtos.AssignRolesRequest;
import com.digitaldynamics.pms.dto.UserDtos.ProfileUpdateRequest;
import com.digitaldynamics.pms.dto.UserDtos.UserResponse;
import com.digitaldynamics.pms.exception.ApiException;
import com.digitaldynamics.pms.model.User;
import com.digitaldynamics.pms.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final AuditService auditService;

    public UserService(UserRepository userRepository, AuditService auditService) {
        this.userRepository = userRepository;
        this.auditService = auditService;
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
        auditService.record(actor, "ASSIGN_ROLES", "User", id, "Roles/status/approval limit updated");
        return toResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(Long id, ProfileUpdateRequest request, String actor) {
        User user = find(id);
        user.setFullName(request.fullName());
        user.setEmail(request.email().toLowerCase());
        auditService.record(actor, "UPDATE_PROFILE", "User", id, "Profile updated");
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
