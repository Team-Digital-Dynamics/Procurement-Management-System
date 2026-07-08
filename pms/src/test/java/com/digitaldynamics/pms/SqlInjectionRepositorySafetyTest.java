package com.digitaldynamics.pms;

import static org.assertj.core.api.Assertions.assertThat;

import com.digitaldynamics.pms.dto.ProcurementDtos.ApprovalActionRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.RequisitionItemRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.RequisitionRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.RfqRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.SupplierRequest;
import com.digitaldynamics.pms.model.ApprovalDecision;
import com.digitaldynamics.pms.model.Rfq;
import com.digitaldynamics.pms.model.SupplierStatus;
import com.digitaldynamics.pms.repository.ApprovalRepository;
import com.digitaldynamics.pms.repository.RfqRepository;
import com.digitaldynamics.pms.repository.UserRepository;
import com.digitaldynamics.pms.service.ProcurementService;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class SqlInjectionRepositorySafetyTest {

    @Autowired
    ProcurementService procurementService;

    @Autowired
    UserRepository userRepository;

        @Autowired
        ApprovalRepository approvalRepository;

    @Autowired
    RfqRepository rfqRepository;

    @Test
    void findByRfqNumberTreatsPayloadAsLiteralValue() {
        var requester = userRepository.findByEmail("requester@digitaldynamics.co.za").orElseThrow();
        var supplier = procurementService.createSupplier(
                new SupplierRequest("SQLi Supplier", "sqli-supplier@test.local", "+27-21-100-0001", "TAX-SQLI-001"),
                "admin@digitaldynamics.co.za");
        procurementService.setSupplierStatus(supplier.id(), SupplierStatus.APPROVED, "admin@digitaldynamics.co.za");

        var requisition = procurementService.createRequisition(
                new RequisitionRequest(
                        "SQL injection safety requisition",
                        "Used to validate parameterized repository lookups",
                        List.of(new RequisitionItemRequest("Security test line", java.math.BigDecimal.ONE,
                                java.math.BigDecimal.valueOf(100)))),
                requester.getId(),
                requester.getEmail());

        procurementService.submitRequisition(requisition.id(), requester.getEmail());

        var approval = approvalRepository
                .findByApproverEmailAndDecision("approver1@digitaldynamics.co.za", ApprovalDecision.PENDING)
                .stream()
                .filter(item -> item.getRequisition().getId().equals(requisition.id()))
                .findFirst()
                .orElseThrow();
        var approver = userRepository.findByEmail("approver1@digitaldynamics.co.za").orElseThrow();
        procurementService.decideApproval(
                approval.getId(),
                new ApprovalActionRequest(ApprovalDecision.APPROVED, "Approved for security testing"),
                approver.getId(),
                approver.getEmail());

        var rfq = procurementService.createRfq(
                new RfqRequest(requisition.id(), Instant.now().plusSeconds(86400), List.of(supplier.id()), 50, 20, 15, 10, 5),
                "procurement@digitaldynamics.co.za");

        String payload = "' OR '1'='1";
        Rfq persistedRfq = rfqRepository.findById(rfq.id()).orElseThrow();
        persistedRfq.setRfqNumber(payload);
        rfqRepository.saveAndFlush(persistedRfq);

        var literalLookup = rfqRepository.findByRfqNumber(payload);
        assertThat(literalLookup).isPresent();
        assertThat(literalLookup.get().getId()).isEqualTo(rfq.id());

        List<String> otherPayloads = List.of(
                "' OR 'x'='x",
                "'; DROP TABLE rfqs; --",
                "' UNION SELECT 1,2,3 --",
                "admin' --",
                "' OR 1=1 #");

        otherPayloads.forEach(candidate ->
                assertThat(rfqRepository.findByRfqNumber(candidate)).isEmpty());
    }
}
