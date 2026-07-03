package com.digitaldynamics.pms.security;

import com.digitaldynamics.pms.exception.ForbiddenException;
import org.springframework.stereotype.Component;

@Component
public class SegregationOfDutiesGuard {

    public void verifyApprovalEligibility(Long currentUserId, Long requesterId) {
        if (currentUserId != null && currentUserId.equals(requesterId)) {
            throw new ForbiddenException("Security Violation: Segregation of Duties policy prevents users from approving their own procurement requisitions.");
        }
    }
}
