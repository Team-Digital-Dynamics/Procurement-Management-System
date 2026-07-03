package com.digitaldynamics.pms.service;

import com.digitaldynamics.pms.dto.ProcurementDtos.EvaluationRecordResponse;
import com.digitaldynamics.pms.dto.ProcurementDtos.QuotationResponse;
import com.digitaldynamics.pms.exception.ApiException;
import com.digitaldynamics.pms.model.EvaluationRecord;
import com.digitaldynamics.pms.model.Quotation;
import com.digitaldynamics.pms.model.Rfq;
import com.digitaldynamics.pms.model.RfqStatus;
import com.digitaldynamics.pms.repository.EvaluationRepository;
import com.digitaldynamics.pms.repository.QuotationRepository;
import com.digitaldynamics.pms.repository.RfqRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EvaluationService {

    private final RfqRepository rfqRepository;
    private final QuotationRepository quotationRepository;
    private final EvaluationRepository evaluationRepository;
    private final AuditService auditService;

    public EvaluationService(RfqRepository rfqRepository, QuotationRepository quotationRepository,
            EvaluationRepository evaluationRepository, AuditService auditService) {
        this.rfqRepository = rfqRepository;
        this.quotationRepository = quotationRepository;
        this.evaluationRepository = evaluationRepository;
        this.auditService = auditService;
    }

    @Transactional
    public List<QuotationResponse> evaluate(Long rfqId, String actor) {
        Rfq rfq = rfqRepository.findById(rfqId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "RFQ not found"));
        List<Quotation> quotes = quotationRepository.findByRfqId(rfqId);
        if (quotes.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No quotations to evaluate");
        }
        BigDecimal lowest = quotes.stream().map(Quotation::getTotalAmount)
                .min(Comparator.naturalOrder()).orElse(BigDecimal.ONE);
        int fastest = quotes.stream().mapToInt(Quotation::getDeliveryDays).min().orElse(1);

        for (Quotation quote : quotes) {
            BigDecimal priceScore = lowest.divide(quote.getTotalAmount(), 6, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            BigDecimal deliveryScore = BigDecimal.valueOf(fastest)
                    .divide(BigDecimal.valueOf(quote.getDeliveryDays()), 6, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            BigDecimal total = weighted(priceScore, rfq.getPriceWeight())
                    .add(weighted(deliveryScore, rfq.getDeliveryWeight()))
                    .add(weighted(BigDecimal.valueOf(quote.getQualityScore()), rfq.getQualityWeight()))
                    .add(weighted(BigDecimal.valueOf(quote.getTermsScore()), rfq.getTermsWeight()))
                    .add(weighted(quote.getSupplier().getPerformanceScore(), rfq.getPerformanceWeight()));
            quote.setEvaluationScore(total.setScale(3, RoundingMode.HALF_UP));

            EvaluationRecord record = new EvaluationRecord();
            record.setRfq(rfq);
            record.setQuotation(quote);
            record.setPriceScore(priceScore.setScale(2, RoundingMode.HALF_UP));
            record.setDeliveryScore(deliveryScore.setScale(2, RoundingMode.HALF_UP));
            record.setQualityScore(BigDecimal.valueOf(quote.getQualityScore()).setScale(2, RoundingMode.HALF_UP));
            record.setTermsScore(BigDecimal.valueOf(quote.getTermsScore()).setScale(2, RoundingMode.HALF_UP));
            record.setPerformanceScore(quote.getSupplier().getPerformanceScore().setScale(2, RoundingMode.HALF_UP));
            record.setTotalWeightedScore(total.setScale(3, RoundingMode.HALF_UP));
            record.setEvaluatedBy(actor);
            record.setEvaluatedAt(Instant.now());
            evaluationRepository.save(record);
        }
        rfq.setStatus(RfqStatus.CLOSED);
        auditService.record(actor, "EVALUATE_RFQ", "Rfq", rfqId, "Quotations evaluated");
        return quotes.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<EvaluationRecordResponse> getEvaluationsForRfq(Long rfqId) {
        return evaluationRepository.findByRfqId(rfqId).stream().map(r ->
                new EvaluationRecordResponse(r.getId(), r.getRfq().getId(), r.getQuotation().getId(),
                        r.getQuotation().getSupplier().getId(), r.getPriceScore(), r.getDeliveryScore(),
                        r.getQualityScore(), r.getTermsScore(), r.getPerformanceScore(),
                        r.getTotalWeightedScore(), r.getEvaluatedBy(), r.getEvaluatedAt(), r.getNotes())
        ).toList();
    }

    private BigDecimal weighted(BigDecimal score, int weight) {
        return score.multiply(BigDecimal.valueOf(weight)).divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP);
    }

    private QuotationResponse toResponse(Quotation quotation) {
        return new QuotationResponse(quotation.getId(), quotation.getRfq().getId(),
                quotation.getSupplier().getId(), quotation.getTotalAmount(), quotation.getDeliveryDays(),
                quotation.getEvaluationScore(), quotation.isWinning());
    }
}
