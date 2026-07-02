# Digital Dynamics Procurement Management System

Digital Dynamics Procurement Management System is a Spring Boot application for managing the core procurement lifecycle: supplier registration, requisitions, approvals, RFQs, quotation evaluation, purchase order generation, goods receipt, reporting, and audit logging.

The project is designed as a practical full-stack procurement prototype with a REST API backend, MySQL persistence, JWT-based security, Flyway-managed schema migrations, and a lightweight static HTML/CSS/JavaScript frontend.

## Features

- User registration, login, role assignment, and account status management
- Role-based access control for requesters, approvers, procurement officers, receiving clerks, and admins
- Supplier registration, approval, suspension, and performance tracking
- Requisition drafting, submission, approval, rejection, and workflow status tracking
- Approval routing by value threshold with self-approval protection
- RFQ creation from approved requisitions
- Supplier quotation submission with deadline and duplicate-submission checks
- Weighted quotation evaluation across price, delivery, quality, terms, and supplier performance
- Purchase order creation from awarded quotations
- Goods received note capture with discrepancy detection
- Dashboard and reporting endpoints
- Insert-only audit logging for key business actions
- OpenAPI/Swagger documentation

## Technology Stack

- Java 17
- Spring Boot 3
- Spring MVC
- Spring Data JPA
- Spring Security
- JWT authentication
- BCrypt password hashing
- MySQL 8
- Flyway database migrations
- Maven
- Docker Compose
- Static HTML, CSS, and JavaScript frontend

## Repository Layout

```text
.
|-- README.md
|-- pms/
    |-- pom.xml
    |-- Dockerfile
    |-- docker-compose.yml
    |-- src/
        |-- main/
        |   |-- java/com/digitaldynamics/pms/
        |   |   |-- config/
        |   |   |-- controller/
        |   |   |-- dto/
        |   |   |-- exception/
        |   |   |-- integration/
        |   |   |-- model/
        |   |   |-- repository/
        |   |   |-- security/
        |   |   |-- service/
        |   |-- resources/
        |       |-- db/migration/
        |       |-- static/
        |-- test/
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Java 17 and Maven, if running outside Docker

### Run With Docker

From the application directory:

```powershell
cd pms
docker compose up --build
```

Open the application at:

```text
http://localhost:8080
```

### Seeded Accounts

Seeded accounts use this password:

```text
Password123!
```

Available users:

- `admin@digitaldynamics.co.za`
- `procurement@digitaldynamics.co.za`
- `requester@digitaldynamics.co.za`
- `approver1@digitaldynamics.co.za`
- `approver2@digitaldynamics.co.za`
- `approver3@digitaldynamics.co.za`
- `receiving@digitaldynamics.co.za`

## API Usage

Log in with:

```http
POST /api/auth/login
```

Then send the returned JWT on protected requests:

```http
Authorization: Bearer <token>
```

API documentation is available at:

```text
GET /api/docs
/swagger-ui.html
```

## Core Workflow

1. Create a requisition with `POST /api/requisitions`.
2. Submit the requisition with `POST /api/requisitions/{id}/submit`.
3. Approve or reject it with `POST /api/approvals/{id}/decision`.
4. Create an RFQ with `POST /api/rfqs`.
5. Submit supplier quotations with `POST /api/quotations`.
6. Evaluate quotations with `POST /api/rfqs/{id}/evaluate`.
7. Award a quotation with `POST /api/awards`.
8. Capture receipt with `POST /api/grns`.

## Development Notes

- Database schema changes are managed through Flyway migrations in `pms/src/main/resources/db/migration`.
- Business workflow logic lives in the service layer.
- REST controllers expose API endpoints and delegate business behavior to services.
- DTO records define the main API request and response contracts.
- The static frontend is served from `pms/src/main/resources/static`.
- Production deployments should provide a strong `PMS_JWT_SECRET` value through environment configuration.

## Testing

From the `pms` directory:

```powershell
.\mvnw.cmd test
```

The test suite includes application context loading and an end-to-end procurement workflow test.

## License

No license has been specified yet.
