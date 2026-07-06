package com.digitaldynamics.pms.repository;

import com.digitaldynamics.pms.model.ApprovalRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApprovalRecordRepository extends JpaRepository<ApprovalRecord, Long> {
}
