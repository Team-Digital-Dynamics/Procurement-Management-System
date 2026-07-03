package com.digitaldynamics.pms.controller;

import com.digitaldynamics.pms.dto.ProcurementDtos.EvaluationRecordResponse;
import com.digitaldynamics.pms.dto.ProcurementDtos.QuotationResponse;
import com.digitaldynamics.pms.security.CurrentUser;
import com.digitaldynamics.pms.service.EvaluationService;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/evaluations")
public class EvaluationController {

    private final EvaluationService evaluationService;

    public EvaluationController(EvaluationService evaluationService) {
        this.evaluationService = evaluationService;
    }

    @PostMapping("/rfq/{rfqId}")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER','ADMIN')")
    List<QuotationResponse> evaluate(@PathVariable Long rfqId, @AuthenticationPrincipal CurrentUser user) {
        return evaluationService.evaluate(rfqId, user.email());
    }

    @GetMapping("/rfq/{rfqId}")
    @PreAuthorize("hasAnyRole('PROCUREMENT_OFFICER','ADMIN')")
    List<EvaluationRecordResponse> getByRfq(@PathVariable Long rfqId) {
        return evaluationService.getEvaluationsForRfq(rfqId);
    }
}
