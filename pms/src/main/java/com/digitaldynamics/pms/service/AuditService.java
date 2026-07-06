package com.digitaldynamics.pms.service;

import com.digitaldynamics.pms.model.AuditLog;
import com.digitaldynamics.pms.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {
    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logEvent(String actor, String action, String entityType, String entityId, String details) {
        AuditLog auditLog = new AuditLog(actor, action, entityType, entityId, details);
        auditLogRepository.save(auditLog);
    }
}
