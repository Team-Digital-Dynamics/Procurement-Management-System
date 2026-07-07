package com.digitaldynamics.pms.repository;

import com.digitaldynamics.pms.model.Rfq;
import com.digitaldynamics.pms.model.RfqStatus;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RfqRepository extends JpaRepository<Rfq, Long> {
    Optional<Rfq> findByRfqNumber(String rfqNumber);
    List<Rfq> findByStatus(RfqStatus status);
    List<Rfq> findByStatusInAndSubmissionDeadlineLessThanEqual(List<RfqStatus> statuses, Instant deadline);
}
