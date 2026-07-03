package com.digitaldynamics.pms.repository;

import com.digitaldynamics.pms.model.AuditLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Append-only audit repository.
 * Design rule: never invoke delete/update operations for audit logs.
 * Audit records must be treated as immutable trail entries once inserted.
 */
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
	List<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, String entityId);
}
