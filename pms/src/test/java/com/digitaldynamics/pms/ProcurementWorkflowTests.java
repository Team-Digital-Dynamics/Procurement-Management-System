package com.digitaldynamics.pms;

import static org.assertj.core.api.Assertions.assertThat;

import com.digitaldynamics.pms.dto.ProcurementDtos.ApprovalActionRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.AwardRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.GrnRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.QuotationRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.RequisitionItemRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.RequisitionRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.RfqRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.SupplierRequest;
import com.digitaldynamics.pms.model.ApprovalDecision;
import com.digitaldynamics.pms.model.PurchaseOrderStatus;
import com.digitaldynamics.pms.model.SupplierStatus;
import com.digitaldynamics.pms.repository.ApprovalRepository;
import com.digitaldynamics.pms.repository.AuditLogRepository;
import com.digitaldynamics.pms.repository.PurchaseOrderRepository;
import com.digitaldynamics.pms.repository.UserRepository;
import com.digitaldynamics.pms.service.ProcurementService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class ProcurementWorkflowTests {
    @Autowired
    ProcurementService procurementService;

    @Autowired
    ApprovalRepository approvalRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    AuditLogRepository auditLogRepository;

    @Test
    void requisitionToReceiptWorkflow() {
        var supplier = procurementService.createSupplier(
                new SupplierRequest("Cape Office Supplies", "quotes@cape-office.test", "0210000000", "TAX-001"),
                "admin@digitaldynamics.co.za");
        procurementService.setSupplierStatus(supplier.id(), SupplierStatus.APPROVED, "admin@digitaldynamics.co.za");

        var requester = userRepository.findByEmail("requester@digitaldynamics.co.za").orElseThrow();
        var requisition = procurementService.createRequisition(
                new RequisitionRequest("Laptop refresh", "Replace failing procurement team laptops",
                        List.of(new RequisitionItemRequest("Business laptop", BigDecimal.ONE, BigDecimal.valueOf(15000)))),
                requester.getId(),
                requester.getEmail());
        procurementService.submitRequisition(requisition.id(), requester.getEmail());

        var approval = approvalRepository.findByApproverEmailAndDecision("approver1@digitaldynamics.co.za", ApprovalDecision.PENDING)
                .stream()
                .filter(item -> item.getRequisition().getId().equals(requisition.id()))
                .findFirst()
                .orElseThrow();
        var approver = userRepository.findByEmail("approver1@digitaldynamics.co.za").orElseThrow();
        procurementService.decideApproval(approval.getId(),
                new ApprovalActionRequest(ApprovalDecision.APPROVED, "Within budget"),
                approver.getId(),
                approver.getEmail());

        var rfq = procurementService.createRfq(new RfqRequest(requisition.id(), Instant.now().plusSeconds(86400),
                List.of(supplier.id()), 50, 20, 15, 10, 5), "procurement@digitaldynamics.co.za");
        var quote = procurementService.submitQuotation(new QuotationRequest(rfq.id(), supplier.id(),
                BigDecimal.valueOf(14500), 5, 90, 85), "supplier-portal");
        procurementService.evaluate(rfq.id(), "procurement@digitaldynamics.co.za");
        var po = procurementService.award(new AwardRequest(quote.id(), null, null), "procurement@digitaldynamics.co.za");
        procurementService.captureGrn(new GrnRequest(po.id(), BigDecimal.valueOf(14500), "Received in full"),
                "receiving@digitaldynamics.co.za");

        assertThat(purchaseOrderRepository.findById(po.id()).orElseThrow().getStatus())
                .isEqualTo(PurchaseOrderStatus.RECEIVED);

        assertThat(auditLogRepository.search(null, null, null, null))
                .extracting("action")
                .contains(
                        "CREATE_SUPPLIER",
                        "SET_SUPPLIER_STATUS",
                        "CREATE_REQUISITION",
                        "SUBMIT_REQUISITION",
                        "DECIDE_APPROVAL",
                        "CREATE_RFQ",
                        "SUBMIT_QUOTATION",
                        "EVALUATE_RFQ",
                        "AWARD_RFQ",
                        "CAPTURE_GRN");
    }
}
