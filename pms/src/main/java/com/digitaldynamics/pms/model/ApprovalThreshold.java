package com.digitaldynamics.pms.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "approval_thresholds")
public class ApprovalThreshold extends BaseEntity {

    @Column(name = "approval_level", nullable = false, unique = true)
    private int level;

    @Enumerated(EnumType.STRING)
    @Column(name = "approver_role", nullable = false, length = 40)
    private UserRole role;

    @Column(name = "min_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal minAmount;

    @Column(name = "max_amount", precision = 14, scale = 2)
    private BigDecimal maxAmount;

    @Column(length = 255)
    private String description;

    public int getLevel() {
        return level;
    }

    public void setLevel(int level) {
        this.level = level;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public BigDecimal getMinAmount() {
        return minAmount;
    }

    public void setMinAmount(BigDecimal minAmount) {
        this.minAmount = minAmount;
    }

    public BigDecimal getMaxAmount() {
        return maxAmount;
    }

    public void setMaxAmount(BigDecimal maxAmount) {
        this.maxAmount = maxAmount;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}