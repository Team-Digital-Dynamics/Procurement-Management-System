# Digital Dynamics Procurement Management System

Digital Dynamics Procurement Management System is a Spring Boot procurement application for managing suppliers, requisitions, approvals, RFQs, quotations, purchase orders, goods receipt, notifications, reporting, and audit logs.

The project is built as a REST API backend with a static HTML/CSS/JavaScript frontend served by Spring Boot. It follows a layered structure with controllers, services, repositories, DTOs, entities, security, scheduled workers, integrations, and static frontend assets.

## Technology Stack

- Java 17
- Spring Boot 3.3.6
- Spring Web / Spring MVC REST controllers
- Spring Data JPA
- Spring Security with JWT authentication
- BCrypt password hashing
- Flyway database migrations
- MySQL 8.4 for local Docker runs
- H2 for tests
- Maven wrapper
- Static HTML, CSS, and JavaScript frontend
- Springdoc OpenAPI / Swagger UI
- Spring Mail integration
- Spring Actuator health and info endpoints

## Repository Layout

```text
.
|-- README.txt
|-- README-old.txt
|-- docker-compose.yml
|-- application.yml
|-- pms/
    |-- README.txt
    |-- README-old.txt
    |-- Dockerfile
    |-- docker-compose.yml
    |-- mvnw
    |-- mvnw.cmd
    |-- pom.xml
    |-- src/
        |-- main/
        |   |-- java/com/digitaldynamics/pms/
        |   |   |-- config/
        |   |   |-- controller/
        |   |   |-- dto/
        |   |   |-- exception/
        |   |   |-- integration/
        |   |   |-- mapper/
        |   |   |-- model/
        |   |   |-- repository/
        |   |   |-- scheduler/
        |   |   |-- security/
        |   |   |-- service/
        |   |   |-- util/
        |   |-- resources/
        |       |-- ai_chatbot/
        |       |-- db/migration/
        |       |-- static/
        |-- test/
```

## Main Features

- Login, registration, password reset, account status tracking, and role assignment
- JWT-secured API requests
- Role-based access for admins, requesters, approvers, procurement officers, receiving clerks, and suppliers
- Supplier registration, status management, and performance scoring
- Requisition creation, submission, approval, rejection, and history views
- Approval routing by approval level and value threshold
- Segregation-of-duties checks to reduce self-approval risk
- RFQ creation from approved requisitions
- Supplier quotation submission
- Weighted quotation evaluation using price, delivery, quality, terms, and supplier performance
- Purchase order creation from awarded quotations
- Goods received note capture and purchase order receipt tracking
- Notifications and scheduled notification dispatch
- RFQ deadline closing scheduler
- Audit logging and admin audit-log view
- Static browser UI pages for dashboards, requisitions, approvals, RFQs, quotations, reports, users, profile, notifications, and supplier workflows
- OpenAPI documentation and Swagger UI

## Run With Docker Compose

You can run from the repository root:

```powershell
$env:PMS_JWT_SECRET="replace-with-a-long-secret-at-least-32-bytes"
$env:PMS_MAIL_PASSWORD="replace-with-mail-password"
docker compose up --build
```

Or from the application module:

```powershell
cd pms
$env:PMS_JWT_SECRET="replace-with-a-long-secret-at-least-32-bytes"
$env:PMS_MAIL_PASSWORD="replace-with-mail-password"
docker compose up --build
```

The app is served at:

```text
http://localhost:8080
```

The Docker MySQL service maps container port `3306` to host port `3307`.

## Run Locally Without Docker

Start a MySQL database named `pms` with user `pms` and password `pms`, or provide your own datasource settings through environment variables.

From the `pms` directory:

```powershell
.\mvnw.cmd spring-boot:run
```

Useful environment variables:

```text
SPRING_PROFILES_ACTIVE=dev
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/pms?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=pms
SPRING_DATASOURCE_PASSWORD=pms
PMS_JWT_SECRET=replace-with-a-long-secret-at-least-32-bytes
PMS_JWT_EXPIRATION_MINUTES=480
PMS_MAIL_HOST=smtp.gmail.com
PMS_MAIL_PORT=587
PMS_MAIL_PROTOCOL=smtp
PMS_MAIL_USERNAME=
PMS_MAIL_PASSWORD=
```

## Seeded Accounts

The application seeds these users on startup when they do not already exist. Each uses this password:

```text
Password123!
```

- `admin@digitaldynamics.co.za`
- `procurement@digitaldynamics.co.za`
- `requester@digitaldynamics.co.za`
- `approver1@digitaldynamics.co.za`
- `approver2@digitaldynamics.co.za`
- `approver3@digitaldynamics.co.za`
- `receiving@digitaldynamics.co.za`

## API Entry Points

Login:

```http
POST /api/auth/login
```

Send the returned token on protected requests:

```http
Authorization: Bearer <token>
```

OpenAPI and Swagger:

```text
GET /api/docs
GET /v3/api-docs
GET /swagger-ui.html
```

Common procurement workflow:

1. Create a requisition with `POST /api/requisitions`.
2. Submit the requisition with `POST /api/requisitions/{id}/submit`.
3. Approve or reject with `POST /api/approvals/{id}/decision`.
4. Create an RFQ with `POST /api/rfqs`.
5. Submit a supplier quotation with `POST /api/quotations`.
6. Evaluate quotations with `POST /api/rfqs/{id}/evaluate`.
7. Award a quotation with `POST /api/awards`.
8. Capture goods receipt with `POST /api/grns`.

Some newer resources also expose `/api/v1/...` paths, including auth, users, requisitions, and quotations.

## Development Notes

- Database migrations live in `pms/src/main/resources/db/migration`.
- Static frontend files live in `pms/src/main/resources/static`.
- Backend request and response contracts are mainly in `pms/src/main/java/com/digitaldynamics/pms/dto`.
- Core business workflow logic is concentrated in the service layer.
- Security configuration is in `pms/src/main/java/com/digitaldynamics/pms/config/SecurityConfig.java`.
- Mail settings should be supplied through environment variables for real deployments.

## Testing

From the `pms` directory:

```powershell
.\mvnw.cmd test
```

Tests run against an H2 in-memory database configured for MySQL compatibility.

## Previous README Copies

The previous README files have been saved as:

- `README-old.txt`
- `pms/README-old.txt`

## License

No license has been specified.
