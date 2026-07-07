package com.digitaldynamics.pms.service;

import com.digitaldynamics.pms.dto.QuotationDtos.QuotationResponse;
import com.digitaldynamics.pms.model.Quotation;
import com.digitaldynamics.pms.model.Rfq;
import com.digitaldynamics.pms.model.Supplier;
import com.digitaldynamics.pms.repository.QuotationRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QuotationService {
    private final QuotationRepository quotationRepository;

    public QuotationService(QuotationRepository quotationRepository) {
        this.quotationRepository = quotationRepository;
    }

    @Transactional(readOnly = true)
    public List<QuotationResponse> all() {
        return quotationRepository.findAllByOrderBySubmittedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private QuotationResponse toResponse(Quotation quotation) {
        Rfq rfq = quotation.getRfq();
        Supplier supplier = quotation.getSupplier();

        BigDecimal evaluationScore = quotation.getEvaluationScore() == null
                ? BigDecimal.ZERO
                : quotation.getEvaluationScore();

        String status = resolveStatus(quotation, evaluationScore);

        return new QuotationResponse(
                quotation.getId(),
                buildQuotationNumber(quotation.getId()),
                rfq != null ? rfq.getId() : null,
                rfq != null ? rfq.getRfqNumber() : "-",
                supplier != null ? supplier.getId() : null,
                supplier != null ? supplier.getName() : "-",
                quotation.getTotalAmount(),
                quotation.getDeliveryDays(),
                quotation.getQualityScore(),
                quotation.getTermsScore(),
                evaluationScore,
                quotation.getSubmittedAt(),
                quotation.isWinning(),
                status);
    }

    private String buildQuotationNumber(Long id) {
        if (id == null) {
            return "QTN-PENDING";
        }

        return "QTN-" + String.format("%05d", id);
    }

    private String resolveStatus(Quotation quotation, BigDecimal evaluationScore) {
        if (quotation.isWinning()) {
            return "AWARDED";
        }

        if (evaluationScore != null && evaluationScore.compareTo(BigDecimal.ZERO) > 0) {
            return "EVALUATED";
        }

        return "SUBMITTED";
    }
}