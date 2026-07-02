# Digital Dynamics Procurement Management System

Spring Boot 3, Java 17, MySQL 8, Flyway, Spring Security, BCrypt, JWT, and a static HTML/CSS/JavaScript UI.

Maven artifact: `digital-dynamics-pms`.

## Run locally

```powershell
docker compose up --build
```

Open `http://localhost:8080`.

Seeded accounts use password `Password123!`:

- `admin@digitaldynamics.co.za`
- `procurement@digitaldynamics.co.za`
- `requester@digitaldynamics.co.za`
- `approver1@digitaldynamics.co.za`
- `approver2@digitaldynamics.co.za`
- `approver3@digitaldynamics.co.za`
- `receiving@digitaldynamics.co.za`

## API

Log in with `POST /api/auth/login`, then send `Authorization: Bearer <token>`.

Endpoint documentation is available at `GET /api/docs`, with OpenAPI UI at `/swagger-ui.html`.

Core workflow:

1. Create a requisition with `POST /api/requisitions`.
2. Submit it with `POST /api/requisitions/{id}/submit`.
3. Approve or reject with `POST /api/approvals/{id}/decision`.
4. Create an RFQ with `POST /api/rfqs`.
5. Submit supplier quotations with `POST /api/quotations`.
6. Evaluate with `POST /api/rfqs/{id}/evaluate`.
7. Award with `POST /api/awards`.
8. Capture receipt with `POST /api/grns`.

Audit logs are insert-only and exposed read-only to admins at `GET /api/audit-logs`.
