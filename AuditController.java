package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.model.AuditLog;
import com.digitaldynamics.pms.repository.AuditLogRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    public AuditController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAll();
    }

    @GetMapping("/{id}")
    public AuditLog getLogById(@PathVariable Long id) {
        return auditLogRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Audit log not found"));
    }

    @GetMapping("/search")
    public List<AuditLog> searchByAction(
            @RequestParam String action) {

        return auditLogRepository
                .findByActionContainingIgnoreCase(action);
    }
}