package com.digitaldynamics.pms.service;

import com.digitaldynamics.pms.dto.ProcurementDtos.ApprovalActionRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.ApprovalResponse;
import com.digitaldynamics.pms.dto.ProcurementDtos.AwardRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.GrnRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.PurchaseOrderResponse;
import com.digitaldynamics.pms.dto.ProcurementDtos.QuotationRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.QuotationResponse;
import com.digitaldynamics.pms.dto.ProcurementDtos.RequisitionRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.RequisitionResponse;
import com.digitaldynamics.pms.dto.ProcurementDtos.RfqRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.RfqResponse;
import com.digitaldynamics.pms.dto.ProcurementDtos.SupplierRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.SupplierResponse;
import com.digitaldynamics.pms.exception.ApiException;
import com.digitaldynamics.pms.model.Approval;
import com.digitaldynamics.pms.model.ApprovalDecision;
import com.digitaldynamics.pms.model.GoodsReceivedNote;
import com.digitaldynamics.pms.model.PurchaseOrder;
import com.digitaldynamics.pms.model.PurchaseOrderStatus;
import com.digitaldynamics.pms.model.Quotation;
import com.digitaldynamics.pms.model.Requisition;
import com.digitaldynamics.pms.model.RequisitionItem;
import com.digitaldynamics.pms.model.RequisitionStatus;
import com.digitaldynamics.pms.model.Rfq;
import com.digitaldynamics.pms.model.RfqStatus;
import com.digitaldynamics.pms.model.Supplier;
import com.digitaldynamics.pms.model.SupplierStatus;
import com.digitaldynamics.pms.model.User;
import com.digitaldynamics.pms.model.UserRole;
import com.digitaldynamics.pms.repository.ApprovalRepository;
import com.digitaldynamics.pms.repository.GoodsReceivedNoteRepository;
import com.digitaldynamics.pms.repository.PurchaseOrderRepository;
import com.digitaldynamics.pms.repository.QuotationRepository;
import com.digitaldynamics.pms.repository.RequisitionRepository;
import com.digitaldynamics.pms.repository.RfqRepository;
import com.digitaldynamics.pms.repository.SupplierRepository;
import com.digitaldynamics.pms.repository.UserRepository;
import com.digitaldynamics.pms.security.SegregationOfDutiesGuard;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProcurementService {
    private final SupplierRepository supplierRepository;
    private final RequisitionRepository requisitionRepository;
    private final ApprovalRepository approvalRepository;
    private final RfqRepository rfqRepository;
    private final QuotationRepository quotationRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final GoodsReceivedNoteRepository grnRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final ProcurementMapper procurementMapper;
    private final SegregationOfDutiesGuard segregationOfDutiesGuard;

    public ProcurementService(
            SupplierRepository supplierRepository,
            RequisitionRepository requisitionRepository,
            ApprovalRepository approvalRepository,
            RfqRepository rfqRepository,
            QuotationRepository quotationRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            GoodsReceivedNoteRepository grnRepository,
            UserRepository userRepository,
            AuditService auditService,
            ProcurementMapper procurementMapper,
            SegregationOfDutiesGuard segregationOfDutiesGuard) {

        this.supplierRepository = supplierRepository;
        this.requisitionRepository = requisitionRepository;
        this.approvalRepository = approvalRepository;
        this.rfqRepository = rfqRepository;
        this.quotationRepository = quotationRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.grnRepository = grnRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.procurementMapper = procurementMapper;
        this.segregationOfDutiesGuard = segregationOfDutiesGuard;
    }

    @Transactional
    public SupplierResponse createSupplier(SupplierRequest request, String actor) {
        String email = request.contactEmail().toLowerCase();

        if (supplierRepository.existsByContactEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Supplier email already exists");
        }

        Supplier supplier = new Supplier();
        supplier.setName(request.name());
        supplier.setContactEmail(email);
        supplier.setPerformanceScore(request.performanceScore());

        supplierRepository.save(supplier);

        auditService.logEvent(
                actor,
                "CREATE_SUPPLIER",
                "Supplier",
                String.valueOf(supplier.getId()),
                "Supplier registered");

        return procurementMapper.toSupplierResponse(supplier);
    }

    @Transactional
    public SupplierResponse updateSupplier(Long id, SupplierRequest request) {
        Supplier supplier = supplier(id);
        String email = request.contactEmail().toLowerCase();

        supplier.setName(request.name());
        supplier.setContactEmail(email);
        supplier.setPerformanceScore(request.performanceScore());

        supplierRepository.save(supplier);

        return procurementMapper.toSupplierResponse(supplier);
    }

    @Transactional
    public SupplierResponse updateSupplier(Long id, SupplierRequest request, String actor) {
        Supplier supplier = supplier(id);
        String email = request.contactEmail().toLowerCase();

        supplier.setName(request.name());
        supplier.setContactEmail(email);
        supplier.setPerformanceScore(request.performanceScore());

        supplierRepository.save(supplier);

        auditService.logEvent(
                actor,
                "UPDATE_SUPPLIER",
                "Supplier",
                String.valueOf(supplier.getId()),
                "Supplier updated");

        return procurementMapper.toSupplierResponse(supplier);
    }

    @Transactional
    public SupplierResponse setSupplierStatus(Long id, SupplierStatus status, String actor) {
        Supplier supplier = supplier(id);
        supplier.setStatus(status);

        auditService.logEvent(
                actor,
                "SET_SUPPLIER_STATUS",
                "Supplier",
                String.valueOf(id),
                "Supplier status changed to " + status);

        return procurementMapper.toSupplierResponse(supplier);
    }

    @Transactional
    public RequisitionResponse createRequisition(RequisitionRequest request, Long requesterId, String actor) {
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Requester not found"));

        Requisition requisition = new Requisition();
        requisition.setRequester(requester);
        requisition.setTitle(request.title());
        requisition.setBusinessJustification(request.businessJustification());

        BigDecimal total = BigDecimal.ZERO;

        for (var itemRequest : request.items()) {
            RequisitionItem item = new RequisitionItem();
            item.setRequisition(requisition);
            item.setDescription(itemRequest.description());
            item.setQuantity(itemRequest.quantity());
            item.setEstimatedUnitPrice(itemRequest.estimatedUnitPrice());

            requisition.getItems().add(item);

            total = total.add(itemRequest.quantity().multiply(itemRequest.estimatedUnitPrice()));
        }

        requisition.setTotalAmount(total);
        requisitionRepository.save(requisition);

        auditService.logEvent(
                actor,
                "CREATE_REQUISITION",
                "Requisition",
                String.valueOf(requisition.getId()),
                "Requisition drafted");

        return procurementMapper.toRequisitionResponse(requisition);
    }

    @Transactional
    public RequisitionResponse submitRequisition(Long id, String actor) {
        Requisition requisition = requisition(id);

        if (requisition.getStatus() != RequisitionStatus.DRAFT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only draft requisitions may be submitted");
        }

        requisition.setStatus(RequisitionStatus.SUBMITTED);

        createApproval(
                requisition,
                approvalRoleFor(requisition.getTotalAmount()),
                approvalLevelFor(requisition.getTotalAmount()));

        auditService.logEvent(
                actor,
                "SUBMIT_REQUISITION",
                "Requisition",
                String.valueOf(id),
                "Requisition submitted for approval");

        return procurementMapper.toRequisitionResponse(requisition);
    }

    @Transactional
    public void decideApproval(Long approvalId, ApprovalActionRequest request, Long approverId, String actor) {
        decideApproval(approvalId, request, approverId, actor, false);
    }

    @Transactional
    public void decideApproval(
            Long approvalId,
            ApprovalActionRequest request,
            Long approverId,
            String actor,
            boolean adminOverride) {

        Approval approval = approvalRepository.findById(approvalId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Approval not found"));

        if (!approval.getApprover().getId().equals(approverId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Approval is not assigned to this user");
        }

        if (!adminOverride) {
            segregationOfDutiesGuard.verifyApprovalEligibility(
                    approverId,
                    approval.getRequisition().getRequester().getId());
        }

        if (approval.getDecision() != ApprovalDecision.PENDING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Approval already decided");
        }

        approval.setDecision(request.decision());
        approval.setComments(request.comments());
        approval.setDecidedAt(Instant.now());

        Requisition requisition = approval.getRequisition();
        requisition.setStatus(
                request.decision() == ApprovalDecision.APPROVED
                        ? RequisitionStatus.APPROVED
                        : RequisitionStatus.REJECTED);

        auditService.logEvent(
                actor,
                "DECIDE_APPROVAL",
                "Approval",
                String.valueOf(approvalId),
                "Decision: " + request.decision());
    }

    @Transactional
    public RfqResponse createRfq(RfqRequest request, String actor) {
        if (request.priceWeight()
                + request.deliveryWeight()
                + request.qualityWeight()
                + request.termsWeight()
                + request.performanceWeight() != 100) {

            throw new ApiException(HttpStatus.BAD_REQUEST, "RFQ evaluation weights must total 100%");
        }

        Requisition requisition = requisition(request.requisitionId());

        if (requisition.getStatus() != RequisitionStatus.APPROVED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only approved requisitions can become RFQs");
        }

        Rfq rfq = new Rfq();
        rfq.setRequisition(requisition);
        rfq.setRfqNumber("RFQ-" + Instant.now().toEpochMilli());
        rfq.setSubmissionDeadline(request.submissionDeadline());
        rfq.setPriceWeight(request.priceWeight());
        rfq.setDeliveryWeight(request.deliveryWeight());
        rfq.setQualityWeight(request.qualityWeight());
        rfq.setTermsWeight(request.termsWeight());
        rfq.setPerformanceWeight(request.performanceWeight());

        requisition.setStatus(RequisitionStatus.RFQ_CREATED);

        rfqRepository.save(rfq);

        auditService.logEvent(
                actor,
                "CREATE_RFQ",
                "Rfq",
                String.valueOf(rfq.getId()),
                "RFQ created from requisition");

        return procurementMapper.toRfqResponse(rfq);
    }

    @Transactional
    public QuotationResponse submitQuotation(QuotationRequest request, String actor) {
        Rfq rfq = rfq(request.rfqId());
        Supplier supplier = supplier(request.supplierId());

        if (rfq.getStatus() != RfqStatus.OPEN || Instant.now().isAfter(rfq.getSubmissionDeadline())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "RFQ is closed or deadline has passed");
        }

        if (supplier.getStatus() != SupplierStatus.APPROVED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Supplier is not approved");
        }

        if (quotationRepository.findByRfqIdAndSupplierId(rfq.getId(), supplier.getId()).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Supplier already submitted a quotation for this RFQ");
        }

        Quotation quotation = new Quotation();
        quotation.setRfq(rfq);
        quotation.setSupplier(supplier);
        quotation.setTotalAmount(request.totalAmount());
        quotation.setDeliveryDays(request.deliveryDays());
        quotation.setQualityScore(request.qualityScore());
        quotation.setTermsScore(request.termsScore());
        quotation.setSubmittedAt(Instant.now());

        quotationRepository.save(quotation);

        auditService.logEvent(
                actor,
                "SUBMIT_QUOTATION",
                "Quotation",
                String.valueOf(quotation.getId()),
                "Quotation submitted");

        return procurementMapper.toQuotationResponse(quotation);
    }

    @Transactional
    public List<QuotationResponse> evaluate(Long rfqId, String actor) {
        Rfq rfq = rfq(rfqId);
        List<Quotation> quotes = quotationRepository.findByRfqId(rfqId);

        if (quotes.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No quotations to evaluate");
        }

        BigDecimal lowest = quotes.stream()
                .map(Quotation::getTotalAmount)
                .min(Comparator.naturalOrder())
                .orElse(BigDecimal.ONE);

        int fastest = quotes.stream()
                .mapToInt(Quotation::getDeliveryDays)
                .min()
                .orElse(1);

        for (Quotation quote : quotes) {
            BigDecimal priceScore = lowest
                    .divide(quote.getTotalAmount(), 6, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));

            BigDecimal deliveryScore = BigDecimal.valueOf(fastest)
                    .divide(BigDecimal.valueOf(quote.getDeliveryDays()), 6, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));

            BigDecimal score = weighted(priceScore, rfq.getPriceWeight())
                    .add(weighted(deliveryScore, rfq.getDeliveryWeight()))
                    .add(weighted(BigDecimal.valueOf(quote.getQualityScore()), rfq.getQualityWeight()))
                    .add(weighted(BigDecimal.valueOf(quote.getTermsScore()), rfq.getTermsWeight()))
                    .add(weighted(quote.getSupplier().getPerformanceScore(), rfq.getPerformanceWeight()));

            quote.setEvaluationScore(score.setScale(3, RoundingMode.HALF_UP));
        }

        rfq.setStatus(RfqStatus.CLOSED);

        auditService.logEvent(
                actor,
                "EVALUATE_RFQ",
                "Rfq",
                String.valueOf(rfqId),
                "Quotations evaluated");

        return quotes.stream()
                .map(procurementMapper::toQuotationResponse)
                .toList();
    }

    @Transactional
    public PurchaseOrderResponse award(AwardRequest request, String actor) {
        Quotation recommended = quotation(request.quotationId());

        Quotation selected = request.overrideQuotationId() == null
                ? recommended
                : quotation(request.overrideQuotationId());

        if (!selected.getRfq().getId().equals(recommended.getRfq().getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Override quotation must belong to the same RFQ");
        }

        if (!selected.getId().equals(recommended.getId())
                && (request.overrideJustification() == null || request.overrideJustification().isBlank())) {

            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Override of recommended supplier requires written justification");
        }

        quotationRepository.findByRfqId(selected.getRfq().getId())
                .forEach(q -> q.setWinning(false));

        selected.setWinning(true);
        selected.getRfq().setStatus(RfqStatus.AWARDED);
        selected.getRfq().getRequisition().setStatus(RequisitionStatus.PO_CREATED);

        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber("PO-" + Instant.now().toEpochMilli());
        po.setQuotation(selected);
        po.setSupplier(selected.getSupplier());
        po.setTotalAmount(selected.getTotalAmount());

        purchaseOrderRepository.save(po);

        auditService.logEvent(
                actor,
                "AWARD_RFQ",
                "PurchaseOrder",
                String.valueOf(po.getId()),
                "PO generated for winning quotation");

        return procurementMapper.toPurchaseOrderResponse(po);
    }

    @Transactional
    public void captureGrn(GrnRequest request, String actor) {
        PurchaseOrder po = purchaseOrderRepository.findById(request.purchaseOrderId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Purchase order not found"));

        GoodsReceivedNote grn = new GoodsReceivedNote();
        grn.setPurchaseOrderId(po.getId());
        grn.setReceivedBy(actor);
        grn.setReceivedValue(request.receivedValue());
        grn.setNotes(request.notes());

        boolean discrepancy = request.receivedValue().compareTo(po.getTotalAmount()) != 0;

        grn.setDiscrepancy(discrepancy);

        po.setStatus(discrepancy
                ? PurchaseOrderStatus.DISCREPANCY
                : PurchaseOrderStatus.RECEIVED);

        po.getQuotation()
                .getRfq()
                .getRequisition()
                .setStatus(discrepancy
                        ? RequisitionStatus.DISCREPANCY
                        : RequisitionStatus.RECEIVED);

        grnRepository.save(grn);

        auditService.logEvent(
                actor,
                "CAPTURE_GRN",
                "GoodsReceivedNote",
                String.valueOf(grn.getId()),
                discrepancy ? "Discrepancy flagged" : "Goods received");
    }

    @Transactional(readOnly = true)
    public Map<String, Object> dashboard() {
        return Map.of(
                "submittedRequisitions", requisitionRepository.countByStatus(RequisitionStatus.SUBMITTED),
                "approvedRequisitions", requisitionRepository.countByStatus(RequisitionStatus.APPROVED),
                "openRfqs", rfqRepository.findByStatus(RfqStatus.OPEN).size(),
                "approvedSuppliers", supplierRepository.findByStatus(SupplierStatus.APPROVED).size());
    }

    @Transactional(readOnly = true)
    public List<SupplierResponse> suppliers() {
        return supplierRepository.findAll()
                .stream()
                .map(procurementMapper::toSupplierResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RequisitionResponse> requisitions() {
        return requisitionRepository.findAll()
                .stream()
                .map(procurementMapper::toRequisitionResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ApprovalResponse> pendingApprovals(String approverEmail, boolean adminView) {
        List<Approval> approvals = adminView
                ? approvalRepository.findAll()
                        .stream()
                        .filter(approval -> approval.getDecision() == ApprovalDecision.PENDING)
                        .toList()
                : approvalRepository.findByApproverEmailAndDecision(
                        approverEmail,
                        ApprovalDecision.PENDING);

        return approvals.stream()
                .sorted(Comparator.comparing(approval -> approval.getRequisition().getId()))
                .map(procurementMapper::toApprovalResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RfqResponse> rfqs() {
        return rfqRepository.findAll()
                .stream()
                .map(procurementMapper::toRfqResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> purchaseOrders() {
        return purchaseOrderRepository.findAll()
                .stream()
                .map(procurementMapper::toPurchaseOrderResponse)
                .toList();
    }

    private void createApproval(Requisition requisition, UserRole role, int level) {
        User approver = userRepository.findByRolesContaining(role)
                .stream()
                .filter(user -> !user.getId().equals(requisition.getRequester().getId()))
                .filter(user -> user.getApprovalLimit().compareTo(requisition.getTotalAmount()) >= 0)
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "No eligible approver found"));

        Approval approval = new Approval();
        approval.setRequisition(requisition);
        approval.setApprover(approver);
        approval.setApprovalLevel(level);

        approvalRepository.save(approval);
    }

    private UserRole approvalRoleFor(BigDecimal amount) {
        if (amount.compareTo(BigDecimal.valueOf(100000)) > 0) {
            return UserRole.APPROVER_LEVEL_3;
        }

        if (amount.compareTo(BigDecimal.valueOf(25000)) > 0) {
            return UserRole.APPROVER_LEVEL_2;
        }

        return UserRole.APPROVER_LEVEL_1;
    }

    private int approvalLevelFor(BigDecimal amount) {
        UserRole role = approvalRoleFor(amount);

        if (role == UserRole.APPROVER_LEVEL_3) {
            return 3;
        }

        if (role == UserRole.APPROVER_LEVEL_2) {
            return 2;
        }

        return 1;
    }

    private BigDecimal weighted(BigDecimal score, int weight) {
        return score
                .multiply(BigDecimal.valueOf(weight))
                .divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP);
    }

    private Supplier supplier(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Supplier not found"));
    }

    private Requisition requisition(Long id) {
        return requisitionRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Requisition not found"));
    }

    private Rfq rfq(Long id) {
        return rfqRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "RFQ not found"));
    }

    private Quotation quotation(Long id) {
        return quotationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Quotation not found"));
    }
}