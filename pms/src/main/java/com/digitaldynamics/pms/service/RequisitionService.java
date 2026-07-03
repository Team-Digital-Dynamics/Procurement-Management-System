package com.digitaldynamics.pms.service;

import com.digitaldynamics.pms.dto.RequisitionCreateDTO;
import com.digitaldynamics.pms.dto.RequisitionDTO;
import com.digitaldynamics.pms.dto.ProcurementDtos.RequisitionRequest;
import com.digitaldynamics.pms.exception.ApiException;
import com.digitaldynamics.pms.exception.ResourceNotFoundException;
import com.digitaldynamics.pms.model.AccountStatus;
import com.digitaldynamics.pms.model.Requisition;
import com.digitaldynamics.pms.model.RequisitionItem;
import com.digitaldynamics.pms.model.RequisitionStatus;
import com.digitaldynamics.pms.model.User;
import com.digitaldynamics.pms.model.UserRole;
import com.digitaldynamics.pms.repository.RequisitionRepository;
import com.digitaldynamics.pms.repository.UserRepository;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RequisitionService {
    private final RequisitionRepository requisitionRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public RequisitionService(RequisitionRepository requisitionRepository, UserRepository userRepository,
            AuditService auditService, NotificationService notificationService) {
        this.requisitionRepository = requisitionRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    @Transactional
    public Requisition createRequisition(RequisitionRequest payload, Long requesterId, String actor) {
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Requester not found"));

        Requisition requisition = new Requisition();
        requisition.setTitle(payload.title());
        requisition.setBusinessJustification(payload.businessJustification());
        requisition.setRequesterId(requester.getId());

        payload.items().forEach(itemDto -> {
            RequisitionItem item = new RequisitionItem();
            item.setDescription(itemDto.description());
            item.setQuantity(itemDto.quantity());
            item.setEstimatedUnitPrice(itemDto.estimatedUnitPrice());
            item.setRequisition(requisition);
            requisition.getItems().add(item);
        });

        BigDecimal totalAmount = requisition.getItems()
                .stream()
                .map(item -> item.getQuantity().multiply(item.getEstimatedUnitPrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        requisition.setTotalAmount(totalAmount);
        requisition.setStatus(RequisitionStatus.PENDING_APPROVAL);

        Requisition saved = requisitionRepository.save(requisition);

        auditService.logEvent(actor, "CREATE_REQUISITION", "Requisition", String.valueOf(saved.getId()),
                "Requisition created and submitted for approval");

        User manager = resolveDesignatedManager();
        notificationService.dispatchAlert(
                manager.getId(),
                manager.getEmail(),
                "REQUISITION_PENDING_APPROVAL",
                "Requisition " + saved.getId() + " requires your approval."
        );

        return saved;
    }

        @Transactional
        public RequisitionDTO createRequisition(RequisitionCreateDTO payload, Long requesterId, String actor) {
                User requester = userRepository.findById(requesterId)
                                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Requester not found"));

                Requisition requisition = new Requisition();
                requisition.setTitle(payload.getTitle());
                requisition.setBusinessJustification(payload.getBusinessJustification());
                requisition.setRequesterId(requester.getId());

                payload.getItems().forEach(itemDto -> {
                        RequisitionItem item = new RequisitionItem();
                        item.setDescription(itemDto.getDescription());
                        item.setQuantity(itemDto.getQuantity());
                        item.setEstimatedUnitPrice(itemDto.getEstimatedUnitPrice());
                        item.setRequisition(requisition);
                        requisition.getItems().add(item);
                });

                BigDecimal totalAmount = requisition.getItems()
                                .stream()
                                .map(item -> item.getQuantity().multiply(item.getEstimatedUnitPrice()))
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                requisition.setTotalAmount(totalAmount);
                requisition.setStatus(RequisitionStatus.PENDING_APPROVAL);

                Requisition saved = requisitionRepository.save(requisition);

                auditService.logEvent(actor, "CREATE_REQUISITION", "Requisition", String.valueOf(saved.getId()),
                                "Requisition created and submitted for approval");

                User manager = resolveDesignatedManager();
                notificationService.dispatchAlert(
                                manager.getId(),
                                manager.getEmail(),
                                "REQUISITION_PENDING_APPROVAL",
                                "Requisition " + saved.getId() + " requires your approval."
                );

                return RequisitionDTO.fromEntity(saved);
        }

        @Transactional(readOnly = true)
        public RequisitionDTO getById(Long id) {
                Requisition requisition = requisitionRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Requisition not found: " + id));
                return RequisitionDTO.fromEntity(requisition);
        }

        @Transactional(readOnly = true)
        public List<RequisitionDTO> myRequestsChronological(Long requesterId) {
                return requisitionRepository.findByRequesterIdOrderByCreatedAtDesc(requesterId)
                                .stream()
                                .sorted(Comparator.comparing(Requisition::getCreatedAt))
                                .map(RequisitionDTO::fromEntity)
                                .toList();
        }

    private User resolveDesignatedManager() {
        return userRepository.findByRolesContaining(UserRole.APPROVER_LEVEL_1)
                .stream()
                .filter(user -> user.getStatus() == AccountStatus.ACTIVE)
                .min(Comparator.comparing(User::getId))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "No active manager is available to receive requisition alerts"));
    }
}
