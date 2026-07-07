package com.digitaldynamics.pms.service;

import com.digitaldynamics.pms.dto.PurchaseOrderDtos.PurchaseOrderResponse;
import com.digitaldynamics.pms.model.PurchaseOrder;
import com.digitaldynamics.pms.model.Quotation;
import com.digitaldynamics.pms.model.Supplier;
import com.digitaldynamics.pms.repository.PurchaseOrderRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PurchaseOrderService {
    private final PurchaseOrderRepository purchaseOrderRepository;

    public PurchaseOrderService(PurchaseOrderRepository purchaseOrderRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> all() {
        return purchaseOrderRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private PurchaseOrderResponse toResponse(PurchaseOrder purchaseOrder) {
        Supplier supplier = purchaseOrder.getSupplier();
        Quotation quotation = purchaseOrder.getQuotation();

        return new PurchaseOrderResponse(
                purchaseOrder.getId(),
                purchaseOrder.getPoNumber(),
                supplier != null ? supplier.getId() : null,
                supplier != null ? supplier.getName() : "-",
                quotation != null ? quotation.getId() : null,
                purchaseOrder.getTotalAmount(),
                purchaseOrder.getStatus(),
                purchaseOrder.getCreatedAt(),
                purchaseOrder.getUpdatedAt());
    }
}