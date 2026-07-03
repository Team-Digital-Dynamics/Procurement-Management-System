package com.digitaldynamics.pms.repository;

import com.digitaldynamics.pms.model.Requisition;
import com.digitaldynamics.pms.model.RequisitionStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequisitionRepository extends JpaRepository<Requisition, Long> {
    List<Requisition> findByRequesterEmail(String email);
    long countByStatus(RequisitionStatus status);
}
