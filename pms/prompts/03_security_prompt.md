# PROMPT 03 - Security, Auth and RBAC

Implement Spring Security with:
- BCrypt password hashing.
- JWT login and stateless API access.
- Account lockout after 5 failed login attempts.
- Server-side role checks for every endpoint.
- CORS configured from application properties.
- Input validation using jakarta validation annotations.
- No plaintext passwords in logs or responses.

Endpoints:
- POST /api/v1/auth/login
- POST /api/v1/auth/logout optional token blacklist or client-side expiry
- GET /api/v1/auth/me
- POST /api/v1/users for admin-created users
- PATCH /api/v1/users/{id}/status
- PATCH /api/v1/users/{id}/role

Permission rules:
- ADMINISTRATOR manages users, roles, thresholds, suppliers.
- REQUESTOR creates and tracks own requisitions.
- APPROVER approves/rejects assigned requisitions only and may not approve own requisitions.
- PROCUREMENT_OFFICER manages RFQs, evaluations, purchase orders, GRNs, and approved suppliers.
- SUPPLIER accesses only RFQs issued to them and their own quotations.
- FINANCE views financial reports and POs.
- AUDITOR has read-only access to audit logs and compliance reports.

Return 401 for unauthenticated, 403 for authenticated but unauthorised.
