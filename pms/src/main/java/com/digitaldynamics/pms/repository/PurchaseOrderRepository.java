package com.digitaldynamics.pms.repository;

import com.digitaldynamics.pms.model.PurchaseOrder;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    @EntityGraph(attributePaths = { "quotation", "supplier" })
    List<PurchaseOrder> findAllByOrderByCreatedAtDesc();

    Optional<PurchaseOrder> findByQuotationId(Long quotationId);
}