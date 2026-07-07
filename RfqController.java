package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.dto.ProcurementDtos.QuotationResponse;
import com.digitaldynamics.pms.dto.ProcurementDtos.RfqRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.RfqResponse;
import com.digitaldynamics.pms.security.CurrentUser;
import com.digitaldynamics.pms.service.EvaluationService;
import com.digitaldynamics.pms.service.RfqService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rfqs")
public class RfqController {

    private final RfqService rfqService;
    private final EvaluationService evaluationService;

    public RfqController(RfqService rfqService, EvaluationService evaluationService) {
        this.rfqService = rfqService;
        this.evaluationService = evaluationService;
    }

    @GetMapping
    List<RfqResponse> list() {
        return rfqService.listRfqs();
    }

    @GetMapping("/{id}")
    RfqResponse get(@PathVariable Long id) {
        return rfqService.getRfq(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER','ADMIN')")
    RfqResponse create(@Valid @RequestBody RfqRequest request, @AuthenticationPrincipal CurrentUser user) {
        return rfqService.createRfq(request, user.email());
    }

    @PostMapping("/{id}/evaluate")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER','ADMIN')")
    List<QuotationResponse> evaluate(@PathVariable Long id, @AuthenticationPrincipal CurrentUser user) {
        return evaluationService.evaluate(id, user.email());
    }
}
