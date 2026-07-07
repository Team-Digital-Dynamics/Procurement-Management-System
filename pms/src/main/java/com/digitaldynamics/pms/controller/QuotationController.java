package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.dto.QuotationDtos.QuotationResponse;
import com.digitaldynamics.pms.service.QuotationService;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({ "/api/v1/quotations", "/api/quotations" })
public class QuotationController {
    private final QuotationService quotationService;

    public QuotationController(QuotationService quotationService) {
        this.quotationService = quotationService;
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
}