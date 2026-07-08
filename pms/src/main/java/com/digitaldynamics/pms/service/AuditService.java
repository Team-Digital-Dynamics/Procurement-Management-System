package com.digitaldynamics.pms.service;

import com.digitaldynamics.pms.model.AuditLog;
import com.digitaldynamics.pms.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {
    private static final int ACTOR_LIMIT = 160;
    private static final int ACTION_LIMIT = 80;
    private static final int ENTITY_TYPE_LIMIT = 80;
    private static final int ENTITY_ID_LIMIT = 80;
    private static final int DETAILS_LIMIT = 2000;
    private static final int IP_ADDRESS_LIMIT = 80;
    private static final int STATUS_LIMIT = 40;

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logEvent(String actor, String action, String entityType, String entityId, String details) {
        logEvent(actor, action, entityType, entityId, details, null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logEvent(String actor, String action, String entityType, String entityId, String details,
            String ipAddress) {
        AuditLog auditLog = new AuditLog(
                truncate(defaultText(actor, "SYSTEM"), ACTOR_LIMIT),
                truncate(requireText(action, "action"), ACTION_LIMIT),
                truncate(requireText(entityType, "entityType"), ENTITY_TYPE_LIMIT),
                truncate(blankToNull(entityId), ENTITY_ID_LIMIT),
                truncate(defaultText(details, "No details provided"), DETAILS_LIMIT),
                truncate(blankToNull(ipAddress), IP_ADDRESS_LIMIT),
                truncate("RECORDED", STATUS_LIMIT));

        auditLogRepository.save(auditLog);
    }

    private static String requireText(String value, String fieldName) {
        String normalized = blankToNull(value);
        if (normalized == null) {
            throw new IllegalArgumentException("Audit " + fieldName + " must be provided");
        }
        return normalized;
    }

    private static String defaultText(String value, String fallback) {
        String normalized = blankToNull(value);
        return normalized == null ? fallback : normalized;
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }
}
