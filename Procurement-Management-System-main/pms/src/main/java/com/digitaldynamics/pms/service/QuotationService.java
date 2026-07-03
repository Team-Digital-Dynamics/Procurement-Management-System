package com.digitaldynamics.pms.service;

import com.digitaldynamics.pms.dto.ProcurementDtos.QuotationRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.QuotationResponse;
import com.digitaldynamics.pms.exception.ApiException;
import com.digitaldynamics.pms.model.Quotation;
import com.digitaldynamics.pms.model.Rfq;
import com.digitaldynamics.pms.model.RfqStatus;
import com.digitaldynamics.pms.model.Supplier;
import com.digitaldynamics.pms.model.SupplierStatus;
import com.digitaldynamics.pms.repository.QuotationRepository;
import com.digitaldynamics.pms.repository.RfqRepository;
import com.digitaldynamics.pms.repository.SupplierRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QuotationService {

    private final QuotationRepository quotationRepository;
    private final RfqRepository rfqRepository;
    private final SupplierRepository supplierRepository;
    private final AuditService auditService;

    public QuotationService(QuotationRepository quotationRepository, RfqRepository rfqRepository,
            SupplierRepository supplierRepository, AuditService auditService) {
        this.quotationRepository = quotationRepository;
        this.rfqRepository = rfqRepository;
        this.supplierRepository = supplierRepository;
        this.auditService = auditService;
    }

    @Transactional
    public QuotationResponse submitQuotation(QuotationRequest request, String actor) {
        Rfq rfq = rfqRepository.findById(request.rfqId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "RFQ not found"));
        Supplier supplier = supplierRepository.findById(request.supplierId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Supplier not found"));
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
        auditService.record(actor, "SUBMIT_QUOTATION", "Quotation", quotation.getId(), "Quotation submitted");
        return toResponse(quotation);
    }

    @Transactional(readOnly = true)
    public List<QuotationResponse> listByRfq(Long rfqId) {
        return quotationRepository.findByRfqId(rfqId).stream().map(this::toResponse).toList();
    }

    public Quotation findById(Long id) {
        return quotationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Quotation not found"));
    }

    private QuotationResponse toResponse(Quotation quotation) {
        return new QuotationResponse(quotation.getId(), quotation.getRfq().getId(),
                quotation.getSupplier().getId(), quotation.getTotalAmount(), quotation.getDeliveryDays(),
                quotation.getEvaluationScore(), quotation.isWinning());
    }
}
