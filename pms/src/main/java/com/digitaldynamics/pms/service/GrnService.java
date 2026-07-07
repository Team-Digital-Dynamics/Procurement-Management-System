package com.digitaldynamics.pms.service;

import com.digitaldynamics.pms.exception.ResourceNotFoundException;
import com.digitaldynamics.pms.model.AccountStatus;
import com.digitaldynamics.pms.model.GoodsReceivedNote;
import com.digitaldynamics.pms.model.PurchaseOrder;
import com.digitaldynamics.pms.model.PurchaseOrderStatus;
import com.digitaldynamics.pms.model.User;
import com.digitaldynamics.pms.model.UserRole;
import com.digitaldynamics.pms.repository.GrnRepository;
import com.digitaldynamics.pms.repository.PurchaseOrderRepository;
import com.digitaldynamics.pms.repository.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GrnService {

    private final GrnRepository grnRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public GrnService(GrnRepository grnRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            AuditService auditService,
            NotificationService notificationService,
            UserRepository userRepository) {
        this.grnRepository = grnRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    @Transactional
    public GoodsReceivedNote captureDelivery(Long purchaseOrderId, String receivedBy, BigDecimal receivedValue, String notes) {
        PurchaseOrder purchaseOrder = purchaseOrderRepository.findById(purchaseOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found: " + purchaseOrderId));

        boolean discrepancy = receivedValue.compareTo(purchaseOrder.getTotalAmount()) != 0;

        GoodsReceivedNote grn = new GoodsReceivedNote();
        grn.setPurchaseOrderId(purchaseOrderId);
        grn.setReceivedBy(receivedBy);
        grn.setReceivedValue(receivedValue);
        grn.setDiscrepancy(discrepancy);
        grn.setNotes(notes);

        GoodsReceivedNote saved = grnRepository.save(grn);

        purchaseOrder.setStatus(discrepancy
                ? PurchaseOrderStatus.DISCREPANCY
                : PurchaseOrderStatus.RECEIVED);
        purchaseOrderRepository.save(purchaseOrder);

        auditService.logEvent(
                receivedBy,
                "CAPTURE_GRN",
                "GoodsReceivedNote",
                String.valueOf(saved.getId()),
                discrepancy
                        ? "Delivery discrepancy flagged for PO " + purchaseOrderId
                        : "Delivery captured for PO " + purchaseOrderId
        );

        if (discrepancy) {
            List<User> procurementOfficers = userRepository.findByRolesContaining(UserRole.PROCUREMENT_OFFICER)
                    .stream()
                    .filter(user -> user.getStatus() == AccountStatus.ACTIVE)
                    .toList();

            for (User officer : procurementOfficers) {
                notificationService.dispatchAlert(
                        officer.getId(),
                        officer.getEmail(),
                        "DELIVERY_DISCREPANCY",
                        "Delivery discrepancy detected for purchase order " + purchaseOrderId
                                + ". Received value " + receivedValue
                                + " differs from expected value " + purchaseOrder.getTotalAmount() + "."
                );
            }
        }

        return saved;
    }
}
