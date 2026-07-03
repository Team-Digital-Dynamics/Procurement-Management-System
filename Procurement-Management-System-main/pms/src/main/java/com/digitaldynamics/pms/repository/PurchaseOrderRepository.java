package com.digitaldynamics.pms.repository;

import com.digitaldynamics.pms.model.PurchaseOrder;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    Optional<PurchaseOrder> findByQuotationId(Long quotationId);
}
