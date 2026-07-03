# PROMPT 08 - Testing

Create tests for:

Unit tests:
- Requisition total calculation.
- Approval routing by threshold.
- Self-approval rejection.
- Quote scoring and recommendation.
- Weight total must equal 100%.
- Late quotation rejection.
- Approved supplier check.
- PO generation after evaluation.
- GRN discrepancy detection.
- Insert-only audit log behaviour.

Integration tests with Testcontainers MySQL:
- Auth login success and failure.
- RBAC 401 and 403 scenarios.
- Full procurement lifecycle: requestor creates requisition -> approver approves -> procurement officer issues RFQ -> supplier submits quote -> evaluation -> PO -> GRN.
- Database constraints and indexes where practical.

Security tests:
- User cannot access another role's restricted endpoints.
- Supplier cannot see other suppliers' quotes.
- Auditor cannot mutate records.
- Password never returned by API.

Frontend smoke tests optional unless using a browser automation library.
