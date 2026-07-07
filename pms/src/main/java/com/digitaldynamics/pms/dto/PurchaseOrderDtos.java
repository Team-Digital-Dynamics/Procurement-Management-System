package com.digitaldynamics.pms.dto;

import com.digitaldynamics.pms.model.PurchaseOrderStatus;
import java.math.BigDecimal;
import java.time.Instant;

public final class PurchaseOrderDtos {
    private PurchaseOrderDtos() {
    }

    public record PurchaseOrderResponse(
            Long id,
            String poNumber,
            Long supplierId,
            String supplierName,
            Long quotationId,
            BigDecimal totalAmount,
            PurchaseOrderStatus status,
            Instant createdAt,
            Instant updatedAt) {
    }
}