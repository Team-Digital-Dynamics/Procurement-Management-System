package com.digitaldynamics.pms.repository;

import com.digitaldynamics.pms.model.GoodsReceivedNote;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GrnRepository extends JpaRepository<GoodsReceivedNote, Long> {
    List<GoodsReceivedNote> findByPurchaseOrderIdOrderByCreatedAtDesc(Long purchaseOrderId);

    List<GoodsReceivedNote> findByDiscrepancyTrueOrderByCreatedAtDesc();
}
