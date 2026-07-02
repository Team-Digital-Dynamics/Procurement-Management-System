package com.digitaldynamics.pms.repository;

import com.digitaldynamics.pms.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
}
