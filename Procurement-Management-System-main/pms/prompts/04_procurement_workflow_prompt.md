# PROMPT 04 - Procurement Workflow Services

Implement service-layer workflows with @Transactional boundaries.

Requisition:
- Requestor creates requisition with one or more line items.
- Calculate total_value as sum(quantity * est_unit_cost).
- Generate reference_no in format REQ-yyyy-00001.
- Initial status: PENDING_APPROVAL.
- Route to approval tier based on total value.
- Write audit log and notification.

Approval:
- Approver can APPROVE, REJECT, or REQUEST_INFO.
- Reject requires comments.
- Self-approval is forbidden.
- Record decision in approval_record.
- If final tier approved, requisition status becomes APPROVED.
- Write audit log and notification.

RFQ:
- Procurement officer creates RFQ only from APPROVED requisition.
- Generate RFQ-yyyy-00001.
- Deadline must be in the future.
- Status starts OPEN.
- Notify selected approved suppliers.

Quotation:
- Supplier submits quotation only before RFQ deadline and only if RFQ is OPEN.
- Only APPROVED suppliers may submit.
- Late submissions must fail with 400.
- One supplier may submit one active quotation per RFQ unless versioning is explicitly implemented.

Evaluation:
- Weights must sum to 100.
- Calculate weighted supplier scores.
- Recommend highest-scoring supplier.
- If procurement officer overrides recommendation, override_justification is required.
- Create one evaluation record per RFQ.

Purchase Order:
- Generate PO only after evaluated RFQ and selected supplier.
- Generate PO-yyyy-00001.
- Link PO to RFQ and supplier.
- Notify supplier and finance.

GRN:
- Record received items against PO.
- Flag discrepancies when quantities or item details do not match PO expectations.
- Support partial delivery.
- Update PO status: PARTIALLY_DELIVERED or DELIVERED.
- Write audit log and notification.
