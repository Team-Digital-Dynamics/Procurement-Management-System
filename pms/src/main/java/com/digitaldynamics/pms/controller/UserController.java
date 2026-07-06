package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.dto.UserRegistrationDTO;
import com.digitaldynamics.pms.dto.UserRegistrationRequest;
import com.digitaldynamics.pms.dto.UserResponse;
import com.digitaldynamics.pms.dto.UserDtos.AssignRolesRequest;
import com.digitaldynamics.pms.dto.UserDtos.ProfileUpdateRequest;
import com.digitaldynamics.pms.model.User;
import com.digitaldynamics.pms.security.CurrentUser;
import com.digitaldynamics.pms.service.UserService;
import jakarta.validation.Valid;
import java.util.LinkedHashSet;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({ "/api/v1/users", "/api/users" })
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<UserResponse> registerUser(@Valid @RequestBody UserRegistrationRequest request) {
        User user = userService.registerUser(toRegistrationDto(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(toUserResponse(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(toUserResponse(userService.find(id)));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<com.digitaldynamics.pms.dto.UserDtos.UserResponse> all() {
        return userService.all();
    }

    @GetMapping("/me")
    public com.digitaldynamics.pms.dto.UserDtos.UserResponse me(@AuthenticationPrincipal CurrentUser user) {
        return userService.findProfile(user.id());
    }

    @PutMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public com.digitaldynamics.pms.dto.UserDtos.UserResponse assign(
            @PathVariable Long id,
            @Valid @RequestBody AssignRolesRequest request,
            @AuthenticationPrincipal CurrentUser user) {

        return userService.assign(id, request, user.email());
    }

    @PutMapping("/me")
    public com.digitaldynamics.pms.dto.UserDtos.UserResponse profile(
            @Valid @RequestBody ProfileUpdateRequest request,
            @AuthenticationPrincipal CurrentUser user) {

        return userService.updateProfile(user.id(), request, user.email());
    }

    private UserRegistrationDTO toRegistrationDto(UserRegistrationRequest request) {
        UserRegistrationDTO dto = new UserRegistrationDTO();
        dto.setEmail(request.email());
        dto.setPassword(request.password());
        dto.setFullName(request.fullName());
        dto.setDepartment(request.department());
        dto.setJobTitle(request.jobTitle());
        dto.setRole(com.digitaldynamics.pms.model.Role.REQUESTOR);
        return dto;
    }

    private UserResponse toUserResponse(User user) {
        LinkedHashSet<String> roles = new LinkedHashSet<>();

        if (user.getRole() != null) {
            roles.add(user.getRole().name());
        }

        user.getRoles().forEach(role -> roles.add(role.name()));

        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                roles,
                user.getDepartment(),
                user.getJobTitle(),
                user.getStatus(),
                user.getFailedLogins(),
                user.getCreatedDate());
    }
}