# PROMPT 06 - Static Frontend

Build a static frontend in `src/main/resources/static` using HTML5, Tailwind CSS, and vanilla JavaScript only.

Pages:
- login.html
- dashboard.html
- requisitions.html
- requisition-new.html
- approvals.html
- suppliers.html
- rfqs.html
- quotations.html
- evaluations.html
- purchase-orders.html
- grn.html
- reports.html
- audit.html
- users.html

Shared JS:
- api-client.js: token handling, fetch wrapper, error handling.
- auth.js: login, logout, role detection.
- navigation.js: role-based menus.
- forms.js: validation helpers.
- chatbot.js: chatbot widget.

Dashboard content by role:
- Requestor: requisition count by status, pending approvals, recent activity.
- Procurement Officer: open RFQs, quotations awaiting evaluation, POs in progress, deliveries due.
- Approver: approval queue with value and age, decisions made this period.
- Finance: committed spend by department, PO values, budget vs actual placeholders.
- Administrator: user counts by role, pending supplier approvals, system health.
- Auditor: audit events, compliance report shortcuts.
- Supplier: RFQs open to supplier, submitted quotations, awarded POs.

The UI may hide unavailable functions, but all authority must still be enforced by the backend.
