package com.digitaldynamics.pms.service;

import com.digitaldynamics.pms.exception.ForbiddenException;
import com.digitaldynamics.pms.model.Role;
import com.digitaldynamics.pms.model.User;
import com.digitaldynamics.pms.model.UserRole;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class PermissionService {
    private static final Logger LOG = LoggerFactory.getLogger(PermissionService.class);

    private static final Map<String, Set<String>> ROLE_PERMISSION_MATRIX = Map.of(
            "REQUESTOR", Set.of("CREATE_REQUISITION"),
            "PROCUREMENT_OFFICER", Set.of("CREATE_REQUISITION", "ISSUE_RFQ", "EVALUATE_QUOTES", "GENERATE_PO"),
            "APPROVER", Set.of("APPROVE_REQUISITION"),
            "ADMINISTRATOR", Set.of("CREATE_REQUISITION", "MANAGE_USERS", "MANAGE_THRESHOLDS")
    );

    public boolean authorize(User user, String action, Long requisitionRequesterId) {
        if (user == null || action == null || action.isBlank()) {
            return false;
        }

        Long currentUserId = user.getId();
        if ("APPROVE_REQUISITION".equals(action)
                && requisitionRequesterId != null
                && currentUserId != null
                && requisitionRequesterId.equals(currentUserId)) {
            LOG.warn("Access denied by SoD policy. userId={} attempted action={} on own requisitionRequesterId={}",
                    currentUserId, action, requisitionRequesterId);
            throw new ForbiddenException("You cannot approve your own requisition.");
        }

        for (String roleName : resolveRoleNames(user)) {
            Set<String> permissions = ROLE_PERMISSION_MATRIX.getOrDefault(roleName, Collections.emptySet());
            if (permissions.contains(action)) {
                return true;
            }
        }
        return false;
    }

    private Set<String> resolveRoleNames(User user) {
        Set<String> roleNames = new LinkedHashSet<>();

        Role primaryRole = user.getRole();
        if (primaryRole != null) {
            roleNames.add(primaryRole.name());
        }

        Set<UserRole> legacyRoles = user.getRoles();
        if (legacyRoles != null) {
            for (UserRole legacyRole : legacyRoles) {
                String mapped = mapLegacyRole(legacyRole);
                if (mapped != null) {
                    roleNames.add(mapped);
                }
            }
        }

        return roleNames;
    }

    private String mapLegacyRole(UserRole role) {
        if (role == null) {
            return null;
        }
        return switch (role) {
            case REQUESTER -> "REQUESTOR";
            case PROCUREMENT_OFFICER -> "PROCUREMENT_OFFICER";
            case APPROVER_LEVEL_1, APPROVER_LEVEL_2, APPROVER_LEVEL_3 -> "APPROVER";
            case ADMIN -> "ADMINISTRATOR";
            case RECEIVING_CLERK, SUPPLIER -> null;
        };
    }
}
