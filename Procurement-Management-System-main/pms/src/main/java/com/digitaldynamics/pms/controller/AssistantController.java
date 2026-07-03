package com.digitaldynamics.pms.controller;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {
    @PostMapping
    Map<String, String> ask(@RequestBody ChatRequest request) {
        String q = request.message().toLowerCase();
        String answer;
        if (q.contains("rfq")) {
            answer = "Create an RFQ only after a requisition is approved. Keep evaluation weights at exactly 100%.";
        } else if (q.contains("approval")) {
            answer = "Approval is routed by value threshold. The requester cannot approve their own requisition.";
        } else if (q.contains("supplier")) {
            answer = "Only approved suppliers may quote, and quotes after the RFQ deadline are rejected.";
        } else {
            answer = "I can help with requisitions, approvals, RFQs, quotations, purchase orders, GRNs, and reports.";
        }
        return Map.of("answer", answer);
    }

    public record ChatRequest(@NotBlank String message) {
    }
}
