# PROMPT 07 - Reports, Notifications and Chatbot

Reports:
- Requisition status report with filters by department, requestor, status, and date range.
- Spend by department report using purchase_order values.
- Supplier performance report using supplier.performance_score and GRN discrepancy history.
- Audit compliance report using audit_log filters by user, entity, action, and date range.
- Export as CSV for v1.0.

Notifications:
- Persist notification records in database.
- Trigger notifications on approval needed, approval decision, RFQ issued, quotation submitted, PO issued, GRN discrepancy.
- Email sending through SMTP integration should be configurable. If SMTP is disabled, database notifications must still work.

Chatbot:
- POST /api/v1/chatbot/query accepts a user query and current route.
- It provides navigation guidance and policy explanations only.
- It must not override business rules, approve requests, submit quotes, or access restricted data.
- It must include the user's role in the prompt context so answers are scoped.
- If external AI API key is missing, return deterministic local help text.
