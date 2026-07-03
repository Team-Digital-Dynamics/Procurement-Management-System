package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.dto.ProcurementDtos.ApprovalActionRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.ApprovalResponse;
import com.digitaldynamics.pms.dto.ProcurementDtos.AwardRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.GrnRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.PurchaseOrderResponse;
import com.digitaldynamics.pms.dto.ProcurementDtos.RequisitionRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.RequisitionResponse;
import com.digitaldynamics.pms.model.UserRole;
import com.digitaldynamics.pms.security.CurrentUser;
import com.digitaldynamics.pms.service.ProcurementService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ProcurementController {
    private final ProcurementService procurementService;

    public ProcurementController(ProcurementService procurementService) {
        this.procurementService = procurementService;
    }

    @GetMapping("/dashboard")
    Map<String, Object> dashboard() {
        return procurementService.dashboard();
    }

    @GetMapping("/requisitions")
    List<RequisitionResponse> requisitions() {
        return procurementService.requisitions();
    }

    @PostMapping("/requisitions")
    @PreAuthorize("hasAnyRole('REQUESTER','ADMIN')")
    RequisitionResponse requisition(@Valid @RequestBody RequisitionRequest request,
            @AuthenticationPrincipal CurrentUser user) {
        return procurementService.createRequisition(request, user.id(), user.email());
    }

    @PostMapping("/requisitions/{id}/submit")
    @PreAuthorize("hasAnyRole('REQUESTER','ADMIN')")
    RequisitionResponse submit(@PathVariable Long id, @AuthenticationPrincipal CurrentUser user) {
        return procurementService.submitRequisition(id, user.email());
    }

    @GetMapping("/approvals")
    @PreAuthorize("hasAnyRole('APPROVER_LEVEL_1','APPROVER_LEVEL_2','APPROVER_LEVEL_3','ADMIN')")
    List<ApprovalResponse> approvals(@AuthenticationPrincipal CurrentUser user) {
        return procurementService.pendingApprovals(user.email(), user.hasRole(UserRole.ADMIN));
    }

    @PostMapping("/approvals/{id}/decision")
    @PreAuthorize("hasAnyRole('APPROVER_LEVEL_1','APPROVER_LEVEL_2','APPROVER_LEVEL_3','ADMIN')")
    void decide(@PathVariable Long id, @Valid @RequestBody ApprovalActionRequest request,
            @AuthenticationPrincipal CurrentUser user) {
        procurementService.decideApproval(id, request, user.id(), user.email(), user.hasRole(UserRole.ADMIN));
    }

    @PostMapping("/awards")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER','ADMIN')")
    PurchaseOrderResponse award(@Valid @RequestBody AwardRequest request, @AuthenticationPrincipal CurrentUser user) {
        return procurementService.award(request, user.email());
    }

    @GetMapping("/purchase-orders")
    @PreAuthorize("hasAnyRole('ADMIN','PROCUREMENT_OFFICER','RECEIVING_CLERK')")
    List<PurchaseOrderResponse> purchaseOrders() {
        return procurementService.purchaseOrders();
    }

    @PostMapping("/grns")
    @PreAuthorize("hasAnyRole('RECEIVING_CLERK','ADMIN')")
    void grn(@Valid @RequestBody GrnRequest request, @AuthenticationPrincipal CurrentUser user) {
        procurementService.captureGrn(request, user.email());
    }

    @GetMapping("/reports")
    @PreAuthorize("hasAnyRole('ADMIN','PROCUREMENT_OFFICER')")
    Map<String, Object> reports() {
        return procurementService.dashboard();
    }
}
