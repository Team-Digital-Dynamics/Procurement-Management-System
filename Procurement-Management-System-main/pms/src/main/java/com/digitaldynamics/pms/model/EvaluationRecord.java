package com.digitaldynamics.pms.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "evaluation_records")
public class EvaluationRecord extends BaseEntity {

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "rfq_id")
    private Rfq rfq;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "quotation_id")
    private Quotation quotation;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal priceScore;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal deliveryScore;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal qualityScore;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal termsScore;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal performanceScore;

    @Column(nullable = false, precision = 8, scale = 3)
    private BigDecimal totalWeightedScore;

    @Column(nullable = false, length = 160)
    private String evaluatedBy;

    @Column(nullable = false)
    private Instant evaluatedAt;

    @Column(length = 500)
    private String notes;

    public Rfq getRfq() {
        return rfq;
    }

    public void setRfq(Rfq rfq) {
        this.rfq = rfq;
    }

    public Quotation getQuotation() {
        return quotation;
    }

    public void setQuotation(Quotation quotation) {
        this.quotation = quotation;
    }

    public BigDecimal getPriceScore() {
        return priceScore;
    }

    public void setPriceScore(BigDecimal priceScore) {
        this.priceScore = priceScore;
    }

    public BigDecimal getDeliveryScore() {
        return deliveryScore;
    }

    public void setDeliveryScore(BigDecimal deliveryScore) {
        this.deliveryScore = deliveryScore;
    }

    public BigDecimal getQualityScore() {
        return qualityScore;
    }

    public void setQualityScore(BigDecimal qualityScore) {
        this.qualityScore = qualityScore;
    }

    public BigDecimal getTermsScore() {
        return termsScore;
    }

    public void setTermsScore(BigDecimal termsScore) {
        this.termsScore = termsScore;
    }

    public BigDecimal getPerformanceScore() {
        return performanceScore;
    }

    public void setPerformanceScore(BigDecimal performanceScore) {
        this.performanceScore = performanceScore;
    }

    public BigDecimal getTotalWeightedScore() {
        return totalWeightedScore;
    }

    public void setTotalWeightedScore(BigDecimal totalWeightedScore) {
        this.totalWeightedScore = totalWeightedScore;
    }

    public String getEvaluatedBy() {
        return evaluatedBy;
    }

    public void setEvaluatedBy(String evaluatedBy) {
        this.evaluatedBy = evaluatedBy;
    }

    public Instant getEvaluatedAt() {
        return evaluatedAt;
    }

    public void setEvaluatedAt(Instant evaluatedAt) {
        this.evaluatedAt = evaluatedAt;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
