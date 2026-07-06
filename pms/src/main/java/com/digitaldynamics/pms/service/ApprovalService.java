package com.digitaldynamics.pms.service;

import com.digitaldynamics.pms.exception.ResourceNotFoundException;
import com.digitaldynamics.pms.model.ApprovalRecord;
import com.digitaldynamics.pms.model.Requisition;
import com.digitaldynamics.pms.model.RequisitionStatus;
import com.digitaldynamics.pms.model.User;
import com.digitaldynamics.pms.repository.ApprovalRecordRepository;
import com.digitaldynamics.pms.repository.RequisitionRepository;
import com.digitaldynamics.pms.security.SegregationOfDutiesGuard;
import java.time.LocalDateTime;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApprovalService {
    private final RequisitionRepository requisitionRepository;
    private final ApprovalRecordRepository approvalRecordRepository;
    private final SegregationOfDutiesGuard segregationOfDutiesGuard;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public ApprovalService(RequisitionRepository requisitionRepository,
            ApprovalRecordRepository approvalRecordRepository,
            SegregationOfDutiesGuard segregationOfDutiesGuard,
            AuditService auditService,
            NotificationService notificationService) {
        this.requisitionRepository = requisitionRepository;
        this.approvalRecordRepository = approvalRecordRepository;
        this.segregationOfDutiesGuard = segregationOfDutiesGuard;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    @Transactional
    public void processApproval(Long requisitionId, Long approverId, String decision, String comments) {
        Requisition requisition = requisitionRepository.findById(requisitionId)
                .orElseThrow(() -> new ResourceNotFoundException("Requisition not found: " + requisitionId));

        segregationOfDutiesGuard.verifyApprovalEligibility(approverId, requisition.getRequesterId());

        ApprovalRecord approvalRecord = new ApprovalRecord();
        approvalRecord.setRequisitionId(requisitionId);
        approvalRecord.setApproverId(approverId);
        approvalRecord.setApprovalLevel(1);
        approvalRecord.setDecision(normalizeDecision(decision));
        approvalRecord.setComments(comments);
        approvalRecord.setDecidedAt(LocalDateTime.now());

        RequisitionStatus nextStatus = toRequisitionStatus(approvalRecord.getDecision());
        requisition.setStatus(nextStatus);

        approvalRecordRepository.save(approvalRecord);
        requisitionRepository.save(requisition);

        auditService.logEvent(String.valueOf(approverId), "PROCESS_APPROVAL", "Requisition",
                String.valueOf(requisitionId),
                "Decision=" + approvalRecord.getDecision() + "; Comments=" +
                        (comments == null ? "" : comments));

        User requester = requisition.getRequester();
        if (requester != null) {
            notificationService.dispatchAlert(
                    requester.getId(),
                    requester.getEmail(),
                    "REQUISITION_" + approvalRecord.getDecision(),
                    "Your requisition " + requisitionId + " has been " + approvalRecord.getDecision() + "."
            );
        }
    }

    private static String normalizeDecision(String decision) {
        if (decision == null) {
            throw new IllegalArgumentException("Decision must be provided");
        }
        String normalized = decision.trim().toUpperCase(Locale.ROOT);
        if (!"APPROVED".equals(normalized) && !"REJECTED".equals(normalized)) {
            throw new IllegalArgumentException("Decision must be APPROVED or REJECTED");
        }
        return normalized;
    }

    private static RequisitionStatus toRequisitionStatus(String decision) {
        return switch (decision) {
            case "APPROVED" -> RequisitionStatus.APPROVED;
            case "REJECTED" -> RequisitionStatus.REJECTED;
            default -> throw new IllegalArgumentException("Unsupported decision: " + decision);
        };
    }
}
