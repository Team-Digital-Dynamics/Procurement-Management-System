package com.digitaldynamics.pms.repository;

import com.digitaldynamics.pms.model.AuditLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Append-only audit repository.
 * Design rule: never invoke delete/update operations for audit logs.
 * Audit records must be treated as immutable trail entries once inserted.
 */
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findAllByOrderByCreatedAtDesc();

    List<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, String entityId);

    List<AuditLog> findByActionContainingIgnoreCaseOrderByCreatedAtDesc(String action);

    List<AuditLog> findByActorContainingIgnoreCaseOrderByCreatedAtDesc(String actor);

    @Query("""
            select log
            from AuditLog log
            where (:actor is null or lower(log.actor) like lower(concat('%', :actor, '%')))
              and (:action is null or lower(log.action) like lower(concat('%', :action, '%')))
              and (:entityType is null or lower(log.entityType) = lower(:entityType))
              and (:entityId is null or log.entityId = :entityId)
            order by log.createdAt desc
            """)
    List<AuditLog> search(
            @Param("actor") String actor,
            @Param("action") String action,
            @Param("entityType") String entityType,
            @Param("entityId") String entityId);
}
