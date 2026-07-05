
package com.digitaldynamics.pms.repository;

import com.digitaldynamics.pms.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByActionContainingIgnoreCase(String action);
}
