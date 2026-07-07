package com.digitaldynamics.pms.repository;

import com.digitaldynamics.pms.model.EvaluationRecord;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EvaluationRepository extends JpaRepository<EvaluationRecord, Long> {
    List<EvaluationRecord> findByRfqId(Long rfqId);
    List<EvaluationRecord> findByQuotationId(Long quotationId);
}
