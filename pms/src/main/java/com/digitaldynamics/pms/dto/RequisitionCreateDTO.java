package com.digitaldynamics.pms.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.List;

public class RequisitionCreateDTO {
    @NotBlank
    private String title;

    @NotBlank
    private String businessJustification;

    @Valid
    @NotEmpty
    private List<RequisitionItemCreateDTO> items;

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

    public List<RequisitionItemCreateDTO> getItems() {
        return items;
    }

    public void setItems(List<RequisitionItemCreateDTO> items) {
        this.items = items;
    }

    public static class RequisitionItemCreateDTO {
        @NotBlank
        private String description;

        @Positive
        private BigDecimal quantity;

        @DecimalMin("0.01")
        private BigDecimal estimatedUnitPrice;

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
