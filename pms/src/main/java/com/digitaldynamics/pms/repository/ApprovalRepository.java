package com.digitaldynamics.pms.repository;

import com.digitaldynamics.pms.model.Approval;
import com.digitaldynamics.pms.model.ApprovalDecision;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApprovalRepository extends JpaRepository<Approval, Long> {
    List<Approval> findByApproverEmailAndDecision(String email, ApprovalDecision decision);

    List<Approval> findByApproverEmailOrderByUpdatedAtDesc(String email);

    List<Approval> findByRequisitionIdOrderByApprovalLevel(Long requisitionId);
}
