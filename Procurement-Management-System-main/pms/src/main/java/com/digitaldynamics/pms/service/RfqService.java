package com.digitaldynamics.pms.service;

import com.digitaldynamics.pms.dto.ProcurementDtos.RfqRequest;
import com.digitaldynamics.pms.dto.ProcurementDtos.RfqResponse;
import com.digitaldynamics.pms.exception.ApiException;
import com.digitaldynamics.pms.model.Requisition;
import com.digitaldynamics.pms.model.RequisitionStatus;
import com.digitaldynamics.pms.model.Rfq;
import com.digitaldynamics.pms.model.RfqStatus;
import com.digitaldynamics.pms.repository.RequisitionRepository;
import com.digitaldynamics.pms.repository.RfqRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RfqService {

    private final RfqRepository rfqRepository;
    private final RequisitionRepository requisitionRepository;
    private final AuditService auditService;

    public RfqService(RfqRepository rfqRepository, RequisitionRepository requisitionRepository,
            AuditService auditService) {
        this.rfqRepository = rfqRepository;
        this.requisitionRepository = requisitionRepository;
        this.auditService = auditService;
    }

    @Transactional
    public RfqResponse createRfq(RfqRequest request, String actor) {
        if (request.priceWeight() + request.deliveryWeight() + request.qualityWeight()
                + request.termsWeight() + request.performanceWeight() != 100) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "RFQ evaluation weights must total 100%");
        }
        Requisition requisition = requisitionRepository.findById(request.requisitionId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Requisition not found"));
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
        auditService.record(actor, "CREATE_RFQ", "Rfq", rfq.getId(), "RFQ created from requisition");
        return toResponse(rfq);
    }

    @Transactional(readOnly = true)
    public List<RfqResponse> listRfqs() {
        return rfqRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<RfqResponse> listByStatus(RfqStatus status) {
        return rfqRepository.findByStatus(status).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public RfqResponse getRfq(Long id) {
        return toResponse(findById(id));
    }

    public Rfq findById(Long id) {
        return rfqRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "RFQ not found"));
    }

    private RfqResponse toResponse(Rfq rfq) {
        return new RfqResponse(rfq.getId(), rfq.getRfqNumber(), rfq.getRequisition().getId(),
                rfq.getSubmissionDeadline(), rfq.getStatus());
    }
}
