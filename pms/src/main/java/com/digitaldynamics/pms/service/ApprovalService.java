package com.digitaldynamics.pms.service;

import com.digitaldynamics.pms.exception.ResourceNotFoundException;
import com.digitaldynamics.pms.model.Approval;
import com.digitaldynamics.pms.model.ApprovalDecision;
import com.digitaldynamics.pms.model.Requisition;
import com.digitaldynamics.pms.model.RequisitionStatus;
import com.digitaldynamics.pms.model.User;
import com.digitaldynamics.pms.repository.ApprovalRepository;
import com.digitaldynamics.pms.repository.RequisitionRepository;
import com.digitaldynamics.pms.repository.UserRepository;
import com.digitaldynamics.pms.security.SegregationOfDutiesGuard;
import java.time.Instant;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApprovalService {
    private final RequisitionRepository requisitionRepository;
    private final ApprovalRepository approvalRepository;
    private final UserRepository userRepository;
    private final SegregationOfDutiesGuard segregationOfDutiesGuard;
    private final NotificationService notificationService;

    public ApprovalService(RequisitionRepository requisitionRepository,
            ApprovalRepository approvalRepository,
            UserRepository userRepository,
            SegregationOfDutiesGuard segregationOfDutiesGuard,
            NotificationService notificationService) {
        this.requisitionRepository = requisitionRepository;
        this.approvalRepository = approvalRepository;
        this.userRepository = userRepository;
        this.segregationOfDutiesGuard = segregationOfDutiesGuard;
        this.notificationService = notificationService;
    }

    @Transactional
    public void processApproval(Long requisitionId, Long approverId, String decision, String comments) {
        Requisition requisition = requisitionRepository.findById(requisitionId)
                .orElseThrow(() -> new ResourceNotFoundException("Requisition not found: " + requisitionId));

        User approver = userRepository.findById(approverId)
            .orElseThrow(() -> new ResourceNotFoundException("Approver not found: " + approverId));

        segregationOfDutiesGuard.verifyApprovalEligibility(approverId, requisition.getRequesterId());

        Approval approval = new Approval();
        approval.setRequisition(requisition);
        approval.setApprover(approver);
        approval.setApprovalLevel(1);
        approval.setDecision(ApprovalDecision.valueOf(normalizeDecision(decision)));
        approval.setComments(comments);
        approval.setDecidedAt(Instant.now());

        RequisitionStatus nextStatus = toRequisitionStatus(approval.getDecision().name());
        requisition.setStatus(nextStatus);

        approvalRepository.save(approval);
        requisitionRepository.save(requisition);

        User requester = requisition.getRequester();
        if (requester != null) {
            notificationService.dispatchAlert(
                    requester.getId(),
                    requester.getEmail(),
                    "REQUISITION_" + approval.getDecision().name(),
                    "Your requisition " + requisitionId + " has been " + approval.getDecision().name() + "."
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
