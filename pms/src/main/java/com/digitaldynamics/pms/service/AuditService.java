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
    public void record(String actor, String action, String entityType, Object entityId, String details) {
        AuditLog log = new AuditLog(
                actor == null ? "system" : actor,
                action,
                entityType,
                entityId == null ? null : String.valueOf(entityId),
                details
        );
        auditLogRepository.save(log);
    }
}
