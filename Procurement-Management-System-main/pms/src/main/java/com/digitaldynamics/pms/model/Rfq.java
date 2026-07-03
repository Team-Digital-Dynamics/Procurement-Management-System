package com.digitaldynamics.pms.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "rfqs")
public class Rfq extends BaseEntity {
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "requisition_id")
    private Requisition requisition;

    @Column(nullable = false, unique = true, length = 40)
    private String rfqNumber;

    @Column(nullable = false)
    private Instant submissionDeadline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RfqStatus status = RfqStatus.OPEN;

    @Column(nullable = false)
    private int priceWeight = 50;

    @Column(nullable = false)
    private int deliveryWeight = 20;

    @Column(nullable = false)
    private int qualityWeight = 15;

    @Column(nullable = false)
    private int termsWeight = 10;

    @Column(nullable = false)
    private int performanceWeight = 5;

    public Requisition getRequisition() {
        return requisition;
    }

    public void setRequisition(Requisition requisition) {
        this.requisition = requisition;
    }

    public String getRfqNumber() {
        return rfqNumber;
    }

    public void setRfqNumber(String rfqNumber) {
        this.rfqNumber = rfqNumber;
    }

    public Instant getSubmissionDeadline() {
        return submissionDeadline;
    }

    public void setSubmissionDeadline(Instant submissionDeadline) {
        this.submissionDeadline = submissionDeadline;
    }

    public RfqStatus getStatus() {
        return status;
    }

    public void setStatus(RfqStatus status) {
        this.status = status;
    }

    public int getPriceWeight() {
        return priceWeight;
    }

    public void setPriceWeight(int priceWeight) {
        this.priceWeight = priceWeight;
    }

    public int getDeliveryWeight() {
        return deliveryWeight;
    }

    public void setDeliveryWeight(int deliveryWeight) {
        this.deliveryWeight = deliveryWeight;
    }

    public int getQualityWeight() {
        return qualityWeight;
    }

    public void setQualityWeight(int qualityWeight) {
        this.qualityWeight = qualityWeight;
    }

    public int getTermsWeight() {
        return termsWeight;
    }

    public void setTermsWeight(int termsWeight) {
        this.termsWeight = termsWeight;
    }

    public int getPerformanceWeight() {
        return performanceWeight;
    }

    public void setPerformanceWeight(int performanceWeight) {
        this.performanceWeight = performanceWeight;
    }
}
