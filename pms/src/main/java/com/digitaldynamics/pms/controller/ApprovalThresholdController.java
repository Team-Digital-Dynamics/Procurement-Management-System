package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.dto.ApprovalThresholdDtos.ApprovalThresholdRequest;
import com.digitaldynamics.pms.dto.ApprovalThresholdDtos.ApprovalThresholdResponse;
import com.digitaldynamics.pms.service.ApprovalThresholdService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({ "/api/approval-thresholds", "/api/v1/approval-thresholds" })
public class ApprovalThresholdController {
    private final ApprovalThresholdService approvalThresholdService;

    public ApprovalThresholdController(ApprovalThresholdService approvalThresholdService) {
        this.approvalThresholdService = approvalThresholdService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMINISTRATOR')")
    public List<ApprovalThresholdResponse> all() {
        return approvalThresholdService.all();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMINISTRATOR')")
    public ApprovalThresholdResponse create(@Valid @RequestBody ApprovalThresholdRequest request) {
        return approvalThresholdService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMINISTRATOR')")
    public ApprovalThresholdResponse update(
            @PathVariable Long id,
            @Valid @RequestBody ApprovalThresholdRequest request) {
        return approvalThresholdService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMINISTRATOR')")
    public void delete(@PathVariable Long id) {
        approvalThresholdService.delete(id);
    }

    @PostMapping("/reset-defaults")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMINISTRATOR')")
    public List<ApprovalThresholdResponse> resetDefaults() {
        return approvalThresholdService.resetDefaults();
    }
}