package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.dto.ProcurementDtos.QuotationRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.QuotationResponse;
import com.digitaldynamics.pms.service.QuotationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/quotations")
public class QuotationController {

    private final QuotationService quotationService;

    public QuotationController(QuotationService quotationService) {
        this.quotationService = quotationService;
    }

    @PostMapping
    QuotationResponse submit(@Valid @RequestBody QuotationRequest request) {
        return quotationService.submitQuotation(request, "supplier-portal");
    }

    @GetMapping("/rfq/{rfqId}")
    List<QuotationResponse> listByRfq(@PathVariable Long rfqId) {
        return quotationService.listByRfq(rfqId);
    }
}
