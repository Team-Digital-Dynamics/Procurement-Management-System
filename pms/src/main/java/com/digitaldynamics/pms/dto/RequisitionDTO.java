package com.digitaldynamics.pms.dto;

import com.digitaldynamics.pms.model.Requisition;
import com.digitaldynamics.pms.model.RequisitionItem;
import com.digitaldynamics.pms.model.RequisitionStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class RequisitionDTO {
    private Long id;
    private String title;
    private String businessJustification;
    private Long requesterId;
    private RequisitionStatus status;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<RequisitionItemDTO> items;

    public static RequisitionDTO fromEntity(Requisition requisition) {
        RequisitionDTO dto = new RequisitionDTO();
        dto.setId(requisition.getId());
        dto.setTitle(requisition.getTitle());
        dto.setBusinessJustification(requisition.getBusinessJustification());
        dto.setRequesterId(requisition.getRequesterId());
        dto.setStatus(requisition.getStatus());
        dto.setTotalAmount(requisition.getTotalAmount());
        dto.setCreatedAt(requisition.getCreatedAt());
        dto.setUpdatedAt(requisition.getUpdatedAt());
        dto.setItems(requisition.getItems().stream().map(RequisitionItemDTO::fromEntity).toList());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getBusinessJustification() {
        return businessJustification;
    }

    public void setBusinessJustification(String businessJustification) {
        this.businessJustification = businessJustification;
    }

    public Long getRequesterId() {
        return requesterId;
    }

    public void setRequesterId(Long requesterId) {
        this.requesterId = requesterId;
    }

    public RequisitionStatus getStatus() {
        return status;
    }

    public void setStatus(RequisitionStatus status) {
        this.status = status;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
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

    public List<RequisitionItemDTO> getItems() {
        return items;
    }

    public void setItems(List<RequisitionItemDTO> items) {
        this.items = items;
    }

    public static class RequisitionItemDTO {
        private Long id;
        private String description;
        private BigDecimal quantity;
        private BigDecimal estimatedUnitPrice;

        public static RequisitionItemDTO fromEntity(RequisitionItem item) {
            RequisitionItemDTO dto = new RequisitionItemDTO();
            dto.setId(item.getId());
            dto.setDescription(item.getDescription());
            dto.setQuantity(item.getQuantity());
            dto.setEstimatedUnitPrice(item.getEstimatedUnitPrice());
            return dto;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public BigDecimal getQuantity() {
            return quantity;
        }

        public void setQuantity(BigDecimal quantity) {
            this.quantity = quantity;
        }

        public BigDecimal getEstimatedUnitPrice() {
            return estimatedUnitPrice;
        }

        public void setEstimatedUnitPrice(BigDecimal estimatedUnitPrice) {
            this.estimatedUnitPrice = estimatedUnitPrice;
        }
    }
}
