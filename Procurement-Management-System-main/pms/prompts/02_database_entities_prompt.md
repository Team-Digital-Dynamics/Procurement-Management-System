# PROMPT 02 - Database and JPA Entities

Create JPA entities and database migrations for these tables:

1. users
Fields: user_id, full_name, email, password_hash, role, department, job_title, status, failed_logins, created_date.
Role enum: REQUESTOR, PROCUREMENT_OFFICER, APPROVER, FINANCE, SUPPLIER, ADMINISTRATOR, AUDITOR.
Status enum: ACTIVE, LOCKED, INACTIVE.

2. supplier
Fields: supplier_id, name, reg_number, contact_details, categories, banking_details, approval_status, performance_score.
Supplier status enum: PENDING, APPROVED, SUSPENDED, DEACTIVATED.

3. requisition
Fields: requisition_id, reference_no, requestor_id, total_value, status, department, cost_centre, justification, required_date, submission_date.
Status enum: PENDING_APPROVAL, APPROVED, REJECTED, RFQ_ISSUED, PO_GENERATED, DELIVERED.

4. requisition_item
Fields: item_id, requisition_id, description, quantity, unit_of_measure, est_unit_cost.

5. approval_record
Fields: approval_id, requisition_id, approver_id, decision, comments, tier, decision_ts.
Decision enum: APPROVE, REJECT, REQUEST_INFO.

6. rfq
Fields: rfq_id, reference_no, requisition_id, description, deadline, status, created_by.
Status enum: OPEN, CLOSED, EVALUATED, AWARDED, CANCELLED.

7. quotation
Fields: quotation_id, rfq_id, supplier_id, total_value, delivery_terms, payment_terms, validity, submission_date.

8. evaluation_record
Fields: evaluation_id, rfq_id, criteria JSON, weights JSON, supplier_scores JSON, recommended_supplier_id, override_justification.

9. purchase_order
Fields: po_id, reference_no, rfq_id, supplier_id, total_value, delivery_address, status, issued_date.
Status enum: ISSUED, PARTIALLY_DELIVERED, DELIVERED, CLOSED, CANCELLED.

10. grn
Fields: grn_id, po_id, received_items JSON, condition_notes, discrepancies, receiver_id, delivery_date.

11. audit_log
Fields: log_id, user_id, action, affected_entity, entity_id, old_value, new_value, event_ts, ip_address.
No foreign key on audit_log.user_id. It must preserve history and remain insert-only.

12. notification
Fields: notification_id, recipient_id, type, message, read_status, created_ts.

Create indexes on email, role, reference numbers, status fields, RFQ/supplier joins, PO status, and audit search fields.
Use InnoDB, utf8mb4, DECIMAL(15,2) for money, and JSON columns where specified.
