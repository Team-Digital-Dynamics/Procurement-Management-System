# PROMPT 05 - REST API Contract

Implement REST endpoints under `/api/v1`.

Auth:
POST /auth/login
GET /auth/me

Users:
GET /users
POST /users
GET /users/{id}
PATCH /users/{id}/status
PATCH /users/{id}/role

Suppliers:
GET /suppliers
POST /suppliers
GET /suppliers/{id}
PATCH /suppliers/{id}/approval-status
PATCH /suppliers/{id}/performance-score

Requisitions:
GET /requisitions
POST /requisitions
GET /requisitions/{id}
GET /requisitions/my
POST /requisitions/{id}/submit optional if draft support is implemented

Approvals:
GET /approvals/queue
POST /approvals/{requisitionId}/decision
GET /approvals/requisitions/{requisitionId}

RFQs:
GET /rfqs
POST /rfqs
GET /rfqs/{id}
PATCH /rfqs/{id}/close

Quotations:
GET /rfqs/{rfqId}/quotations
POST /rfqs/{rfqId}/quotations
GET /quotations/{id}

Evaluations:
POST /rfqs/{rfqId}/evaluation
GET /rfqs/{rfqId}/evaluation

Purchase Orders:
GET /purchase-orders
POST /rfqs/{rfqId}/purchase-order
GET /purchase-orders/{id}

GRNs:
POST /purchase-orders/{poId}/grns
GET /purchase-orders/{poId}/grns

Audit:
GET /audit-logs
GET /audit-logs/entity/{entity}/{entityId}
No POST, PATCH, PUT, DELETE for audit logs.

Notifications:
GET /notifications
PATCH /notifications/{id}/read

Reports:
GET /reports/requisition-status
GET /reports/spend-by-department
GET /reports/supplier-performance
GET /reports/audit-compliance

Chatbot:
POST /chatbot/query

Create OpenAPI documentation and request/response DTOs for all endpoints.
