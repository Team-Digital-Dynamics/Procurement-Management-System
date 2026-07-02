package com.digitaldynamics.pms.controller;

import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/docs")
public class DocsController {
    @GetMapping
    Map<String, Object> docs() {
        return Map.of(
                "title", "Digital Dynamics PMS API",
                "auth", "Use POST /api/auth/login and send Authorization: Bearer <token>",
                "endpoints", List.of(
                        "POST /api/auth/register", "POST /api/auth/login", "GET /api/users",
                        "PUT /api/users/{id}/roles", "POST /api/suppliers", "PUT /api/suppliers/{id}/status",
                        "POST /api/requisitions", "POST /api/requisitions/{id}/submit",
                        "POST /api/approvals/{id}/decision", "POST /api/rfqs", "POST /api/quotations",
                        "POST /api/rfqs/{id}/evaluate", "POST /api/awards", "POST /api/grns",
                        "GET /api/reports", "GET /api/audit-logs", "POST /api/assistant"
                )
        );
    }
}
