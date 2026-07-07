package com.digitaldynamics.pms.scheduler;

import com.digitaldynamics.pms.model.Rfq;
import com.digitaldynamics.pms.model.RfqStatus;
import com.digitaldynamics.pms.repository.RfqRepository;
import com.digitaldynamics.pms.service.AuditService;
import java.time.Instant;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class RfqDeadlineCloseJob {

    private static final String SYSTEM_ACTOR = "SYSTEM";

    private final RfqRepository rfqRepository;
    private final AuditService auditService;

    public RfqDeadlineCloseJob(RfqRepository rfqRepository, AuditService auditService) {
        this.rfqRepository = rfqRepository;
        this.auditService = auditService;
    }

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void closeExpiredRfqs() {
        Instant now = Instant.now();

        // ACTIVE is not currently part of RfqStatus; OPEN covers actionable live RFQs.
        List<Rfq> expiredRfqs = rfqRepository.findByStatusInAndSubmissionDeadlineLessThanEqual(
                List.of(RfqStatus.OPEN),
                now
        );

        for (Rfq rfq : expiredRfqs) {
            rfq.setStatus(RfqStatus.CLOSED);
            rfqRepository.save(rfq);

            auditService.logEvent(
                    SYSTEM_ACTOR,
                    "AUTO_CLOSE_RFQ",
                    "Rfq",
                    String.valueOf(rfq.getId()),
                    "RFQ auto-closed after submission deadline at " + now
            );
        }
    }
}
