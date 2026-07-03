package com.digitaldynamics.pms.service;

import com.digitaldynamics.pms.dto.ProcurementDtos.ApprovalResponse;
import com.digitaldynamics.pms.dto.ProcurementDtos.PurchaseOrderResponse;
import com.digitaldynamics.pms.dto.ProcurementDtos.QuotationResponse;
import com.digitaldynamics.pms.dto.ProcurementDtos.RequisitionResponse;
import com.digitaldynamics.pms.dto.ProcurementDtos.RfqResponse;
import com.digitaldynamics.pms.dto.ProcurementDtos.SupplierResponse;
import com.digitaldynamics.pms.model.Approval;
import com.digitaldynamics.pms.model.PurchaseOrder;
import com.digitaldynamics.pms.model.Quotation;
import com.digitaldynamics.pms.model.Requisition;
import com.digitaldynamics.pms.model.Rfq;
import com.digitaldynamics.pms.model.Supplier;
import org.springframework.stereotype.Component;

@Component
public class ProcurementMapper {
    public SupplierResponse toSupplierResponse(Supplier supplier) {
        return new SupplierResponse(supplier.getId(), supplier.getName(), supplier.getContactEmail(),
                supplier.getStatus(), supplier.getPerformanceScore());
    }

    public RequisitionResponse toRequisitionResponse(Requisition requisition) {
        return new RequisitionResponse(requisition.getId(), requisition.getTitle(), requisition.getStatus(),
                requisition.getTotalAmount(), requisition.getRequester().getEmail());
    }

    public ApprovalResponse toApprovalResponse(Approval approval) {
        Requisition requisition = approval.getRequisition();
        return new ApprovalResponse(approval.getId(), requisition.getId(), requisition.getTitle(),
                requisition.getRequester().getEmail(), requisition.getTotalAmount(), approval.getApprovalLevel(),
                approval.getApprover().getEmail(), approval.getDecision(), approval.getComments());
    }

    public RfqResponse toRfqResponse(Rfq rfq) {
        return new RfqResponse(rfq.getId(), rfq.getRfqNumber(), rfq.getRequisition().getId(),
                rfq.getSubmissionDeadline(), rfq.getStatus());
    }

    public QuotationResponse toQuotationResponse(Quotation quotation) {
        return new QuotationResponse(quotation.getId(), quotation.getRfq().getId(), quotation.getSupplier().getId(),
                quotation.getTotalAmount(), quotation.getDeliveryDays(), quotation.getEvaluationScore(),
                quotation.isWinning());
    }

    public PurchaseOrderResponse toPurchaseOrderResponse(PurchaseOrder po) {
        return new PurchaseOrderResponse(po.getId(), po.getPoNumber(), po.getSupplier().getId(),
                po.getTotalAmount(), po.getStatus().name());
    }
}
