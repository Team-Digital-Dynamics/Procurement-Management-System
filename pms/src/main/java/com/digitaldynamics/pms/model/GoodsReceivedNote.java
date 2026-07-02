package com.digitaldynamics.pms.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "goods_received_notes")
public class GoodsReceivedNote extends BaseEntity {
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_id")
    private PurchaseOrder purchaseOrder;

    @Column(nullable = false, length = 80)
    private String receivedBy;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal receivedValue;

    @Column(nullable = false)
    private boolean discrepancy;

    @Column(length = 1000)
    private String notes;

    public PurchaseOrder getPurchaseOrder() {
        return purchaseOrder;
    }

    public void setPurchaseOrder(PurchaseOrder purchaseOrder) {
        this.purchaseOrder = purchaseOrder;
    }

    public String getReceivedBy() {
        return receivedBy;
    }

    public void setReceivedBy(String receivedBy) {
        this.receivedBy = receivedBy;
    }

    public BigDecimal getReceivedValue() {
        return receivedValue;
    }

    public void setReceivedValue(BigDecimal receivedValue) {
        this.receivedValue = receivedValue;
    }

    public boolean isDiscrepancy() {
        return discrepancy;
    }

    public void setDiscrepancy(boolean discrepancy) {
        this.discrepancy = discrepancy;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
