package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.dto.ProcurementDtos.QuotationRequest;
import com.digitaldynamics.pms.dto.QuotationDtos.QuotationResponse;
import com.digitaldynamics.pms.security.CurrentUser;
import com.digitaldynamics.pms.service.ProcurementService;
import com.digitaldynamics.pms.service.QuotationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({ "/api/v1/quotations", "/api/quotations" })
public class QuotationController {
    private final QuotationService quotationService;
    private final ProcurementService procurementService;

    public QuotationController(QuotationService quotationService, ProcurementService procurementService) {
        this.quotationService = quotationService;
        this.procurementService = procurementService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMINISTRATOR', 'PROCUREMENT_OFFICER', 'SUPPLIER')")
    public List<QuotationResponse> all() {
        return quotationService.all();
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMINISTRATOR', 'PROCUREMENT_OFFICER', 'SUPPLIER')")
    public List<QuotationResponse> myQuotations() {
        return quotationService.all();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMINISTRATOR', 'PROCUREMENT_OFFICER', 'SUPPLIER')")
    public com.digitaldynamics.pms.dto.ProcurementDtos.QuotationResponse submitQuotation(
            @Valid @RequestBody QuotationRequest request,
            @AuthenticationPrincipal CurrentUser user) {
        String actor = user != null ? user.email() : "supplier-portal";
        return procurementService.submitQuotation(request, actor);
    }
}