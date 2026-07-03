package com.digitaldynamics.pms.model;

import java.time.LocalDateTime;

public class ApprovalRecord {
    private Long id;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private Long requisitionId;

    private Long approverId;

    private int approvalLevel;

    private String decision;

    private String comments;

    private LocalDateTime decidedAt;

    public ApprovalRecord() {
    }

    public ApprovalRecord(Long id, LocalDateTime createdAt, LocalDateTime updatedAt, Long requisitionId, Long approverId,
                          int approvalLevel, String decision, String comments, LocalDateTime decidedAt) {
        this.id = id;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.requisitionId = requisitionId;
        this.approverId = approverId;
        this.approvalLevel = approvalLevel;
        this.decision = decision;
        this.comments = comments;
        this.decidedAt = decidedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Long getRequisitionId() {
        return requisitionId;
    }

    public void setRequisitionId(Long requisitionId) {
        this.requisitionId = requisitionId;
    }

    public Long getApproverId() {
        return approverId;
    }

    public void setApproverId(Long approverId) {
        this.approverId = approverId;
    }

    public int getApprovalLevel() {
        return approvalLevel;
    }

    public void setApprovalLevel(int approvalLevel) {
        this.approvalLevel = approvalLevel;
    }

    public String getDecision() {
        return decision;
    }

    public void setDecision(String decision) {
        this.decision = decision;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public LocalDateTime getDecidedAt() {
        return decidedAt;
    }

    public void setDecidedAt(LocalDateTime decidedAt) {
        this.decidedAt = decidedAt;
    }
}
