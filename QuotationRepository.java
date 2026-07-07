package com.digitaldynamics.pms.repository;

import com.digitaldynamics.pms.model.Quotation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuotationRepository extends JpaRepository<Quotation, Long> {
    List<Quotation> findByRfqId(Long rfqId);
    Optional<Quotation> findByRfqIdAndSupplierId(Long rfqId, Long supplierId);
    Optional<Quotation> findByRfqIdAndWinningTrue(Long rfqId);
}
