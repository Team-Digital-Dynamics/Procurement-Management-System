package com.digitaldynamics.pms.dto;

import com.digitaldynamics.pms.model.ApprovalDecision;
import com.digitaldynamics.pms.model.RequisitionStatus;
import com.digitaldynamics.pms.model.RfqStatus;
import com.digitaldynamics.pms.model.SupplierStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class ProcurementDtos {
        private ProcurementDtos() {
        }

        public record SupplierRequest(
                        String name,
                        String contactEmail,
                        String phone,
                        String taxNumber,
                        BigDecimal performanceScore) {
                public SupplierRequest(String name, String category, String contactEmail, BigDecimal performanceScore) {
                        this(name, contactEmail, null, null, performanceScore);
                }

                public SupplierRequest(String name, String contactEmail, String phone, String taxNumber) {
                        this(name, contactEmail, phone, taxNumber, BigDecimal.valueOf(70));
                }

                public SupplierRequest(String name, String contactEmail, String category) {
                        this(name, contactEmail, null, null, BigDecimal.valueOf(70));
                }
        }

        public record SupplierResponse(
                        Long id,
                        String name,
                        String contactEmail,
                        SupplierStatus status,
                        BigDecimal performanceScore) {
        }

        public record RequisitionItemRequest(@NotBlank String description, @Positive BigDecimal quantity,
                        @DecimalMin("0.01") BigDecimal estimatedUnitPrice) {
        }

        public record RequisitionRequest(@NotBlank String title, @NotBlank String businessJustification,
                        @Valid @NotEmpty List<RequisitionItemRequest> items) {
        }

        public record RequisitionItemResponse(Long id, String description, BigDecimal quantity,
                        BigDecimal estimatedUnitPrice, BigDecimal lineTotal) {
        }

        public record RequisitionResponse(Long id, String title, String businessJustification,
                        RequisitionStatus status, BigDecimal totalAmount,
                        String requesterEmail, List<RequisitionItemResponse> items) {
        }

        public record ApprovalActionRequest(@NotNull ApprovalDecision decision, String comments) {
        }

        public record ApprovalResponse(Long id, Long requisitionId, String requisitionTitle,
                        String requesterEmail, BigDecimal totalAmount, int approvalLevel,
                        String approverEmail, ApprovalDecision decision, String comments) {
        }

        public record RfqRequest(@NotNull Long requisitionId, @Future Instant submissionDeadline,
                        @Min(0) @Max(100) int priceWeight, @Min(0) @Max(100) int deliveryWeight,
                        @Min(0) @Max(100) int qualityWeight, @Min(0) @Max(100) int termsWeight,
                        @Min(0) @Max(100) int performanceWeight) {
        }

        public record RfqResponse(Long id, String rfqNumber, Long requisitionId, Instant submissionDeadline,
                        RfqStatus status) {
        }

        public record QuotationRequest(@NotNull Long rfqId, @NotNull Long supplierId,
                        @DecimalMin("0.01") BigDecimal totalAmount,
                        @Min(1) int deliveryDays, @Min(0) @Max(100) int qualityScore,
                        @Min(0) @Max(100) int termsScore) {
        }

        public record QuotationResponse(Long id, Long rfqId, Long supplierId, BigDecimal totalAmount,
                        int deliveryDays, BigDecimal evaluationScore, boolean winning) {
        }

        public record AwardRequest(@NotNull Long quotationId, Long overrideQuotationId, String overrideJustification) {
        }

        public record PurchaseOrderResponse(Long id, String poNumber, Long supplierId, BigDecimal totalAmount,
                        String status) {
        }

        public record GrnRequest(@NotNull Long purchaseOrderId, @DecimalMin("0.00") BigDecimal receivedValue,
                        String notes) {
        }
}
