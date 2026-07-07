package com.digitaldynamics.pms.dto;

import java.math.BigDecimal;
import java.time.Instant;

public final class QuotationDtos {
    private QuotationDtos() {
    }

    public record QuotationResponse(
            Long id,
            String quotationNumber,
            Long rfqId,
            String rfqNumber,
            Long supplierId,
            String supplierName,
            BigDecimal totalAmount,
            int deliveryDays,
            int qualityScore,
            int termsScore,
            BigDecimal evaluationScore,
            Instant submittedAt,
            boolean winning,
            String status) {
    }
}