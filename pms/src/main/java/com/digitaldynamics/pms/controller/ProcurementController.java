package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.dto.ProcurementDtos.ApprovalActionRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.AwardRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.GrnRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.PurchaseOrderResponse;
import com.digitaldynamics.pms.dto.ProcurementDtos.QuotationRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.QuotationResponse;
import com.digitaldynamics.pms.dto.ProcurementDtos.RequisitionRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.RequisitionResponse;
import com.digitaldynamics.pms.dto.ProcurementDtos.RfqRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.RfqResponse;
import com.digitaldynamics.pms.dto.ProcurementDtos.SupplierRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.SupplierResponse;
import com.digitaldynamics.pms.model.SupplierStatus;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

    @GetMapping("/suppliers")
    List<SupplierResponse> suppliers() {
        return procurementService.suppliers();
    }

    @PostMapping("/suppliers")
    @PreAuthorize("hasAnyRole('ADMIN','PROCUREMENT_OFFICER')")
    SupplierResponse supplier(@Valid @RequestBody SupplierRequest request, @AuthenticationPrincipal CurrentUser user) {
        return procurementService.createSupplier(request, user.email());
    }

    @PutMapping("/suppliers/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','PROCUREMENT_OFFICER')")
    SupplierResponse supplierStatus(@PathVariable Long id, @RequestParam SupplierStatus status,
                                    @AuthenticationPrincipal CurrentUser user) {
        return procurementService.setSupplierStatus(id, status, user.email());
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

    @PostMapping("/approvals/{id}/decision")
    @PreAuthorize("hasAnyRole('APPROVER_LEVEL_1','APPROVER_LEVEL_2','APPROVER_LEVEL_3','ADMIN')")
    void decide(@PathVariable Long id, @Valid @RequestBody ApprovalActionRequest request,
                @AuthenticationPrincipal CurrentUser user) {
        procurementService.decideApproval(id, request, user.id(), user.email());
    }

    @GetMapping("/rfqs")
    List<RfqResponse> rfqs() {
        return procurementService.rfqs();
    }

    @PostMapping("/rfqs")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER','ADMIN')")
    RfqResponse rfq(@Valid @RequestBody RfqRequest request, @AuthenticationPrincipal CurrentUser user) {
        return procurementService.createRfq(request, user.email());
    }

    @PostMapping("/quotations")
    QuotationResponse quotation(@Valid @RequestBody QuotationRequest request) {
        return procurementService.submitQuotation(request, "supplier-portal");
    }

    @PostMapping("/rfqs/{id}/evaluate")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER','ADMIN')")
    List<QuotationResponse> evaluate(@PathVariable Long id, @AuthenticationPrincipal CurrentUser user) {
        return procurementService.evaluate(id, user.email());
    }

    @PostMapping("/awards")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER','ADMIN')")
    PurchaseOrderResponse award(@Valid @RequestBody AwardRequest request, @AuthenticationPrincipal CurrentUser user) {
        return procurementService.award(request, user.email());
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
