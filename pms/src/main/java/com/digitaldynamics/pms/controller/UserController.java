package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.dto.UserDtos.AssignRolesRequest;
import com.digitaldynamics.pms.dto.UserDtos.ProfileUpdateRequest;
import com.digitaldynamics.pms.dto.UserDtos.UserResponse;
import com.digitaldynamics.pms.security.CurrentUser;
import com.digitaldynamics.pms.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    List<UserResponse> all() {
        return userService.all();
    }

    @GetMapping("/me")
    UserResponse me(@AuthenticationPrincipal CurrentUser user) {
        return userService.findProfile(user.id());
    }

    @PutMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    UserResponse assign(@PathVariable Long id, @Valid @RequestBody AssignRolesRequest request,
            @AuthenticationPrincipal CurrentUser user) {
        return userService.assign(id, request, user.email());
    }

    @PutMapping("/me")
    UserResponse profile(@Valid @RequestBody ProfileUpdateRequest request, @AuthenticationPrincipal CurrentUser user) {
        return userService.updateProfile(user.id(), request, user.email());
    }
}
