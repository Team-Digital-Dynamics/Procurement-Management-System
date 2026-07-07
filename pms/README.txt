# Digital Dynamics PMS Application Module

This directory contains the Spring Boot application for the Digital Dynamics Procurement Management System.

It includes the REST API, security configuration, business services, JPA entities, repositories, Flyway migrations, scheduled workers, mail integration, tests, Dockerfile, module-level Docker Compose file, and the static browser UI.

Maven artifact:

```text
com.digitaldynamics:digital-dynamics-pms:0.0.1-SNAPSHOT
```

## Module Structure

```text
pms/
|-- Dockerfile
|-- docker-compose.yml
|-- mvnw
|-- mvnw.cmd
|-- pom.xml
|-- README.txt
|-- README-old.txt
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
    |       |-- application.yml
    |       |-- application-dev.yml
    |       |-- application-prod.yml
    |       |-- ai_chatbot/
    |       |-- db/migration/
    |       |-- static/
    |-- test/
```

## Runtime Requirements

- Java 17
- Maven wrapper included in this directory
- MySQL 8.x for normal local/dev runs
- Docker and Docker Compose for containerized runs

## Run With Docker Compose

From this `pms` directory:

```powershell
$env:PMS_JWT_SECRET="replace-with-a-long-secret-at-least-32-bytes"
$env:PMS_MAIL_PASSWORD="replace-with-mail-password"
docker compose up --build
```

Open:

```text
http://localhost:8080
```

The bundled compose file starts:

- `mysql`, using database `pms`, user `pms`, and host port `3307`
- `app`, built from `Dockerfile`, exposed on port `8080`

## Run With Maven

Start MySQL first, then run:

```powershell
.\mvnw.cmd spring-boot:run
```

The default `dev` profile expects:

```text
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/pms?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=pms
SPRING_DATASOURCE_PASSWORD=pms
```

The main configuration also supports these variables:

```text
SPRING_PROFILES_ACTIVE=dev
PMS_JWT_SECRET=replace-with-a-long-secret-at-least-32-bytes
PMS_JWT_EXPIRATION_MINUTES=480
PMS_MAIL_HOST=smtp.gmail.com
PMS_MAIL_PORT=587
PMS_MAIL_PROTOCOL=smtp
PMS_MAIL_USERNAME=
PMS_MAIL_PASSWORD=
PMS_MAIL_TEST_RECIPIENT=admindigitaldynamics@gmail.com
```

## Seeded Users

The `DataSeeder` creates these users if missing:

```text
admin@digitaldynamics.co.za
procurement@digitaldynamics.co.za
requester@digitaldynamics.co.za
approver1@digitaldynamics.co.za
approver2@digitaldynamics.co.za
approver3@digitaldynamics.co.za
receiving@digitaldynamics.co.za
```

Default password:

```text
Password123!
```

## API Summary

Authentication:

```http
POST /api/auth/login
POST /api/auth/register
POST /api/auth/reset-password
```

Main workflow endpoints:

```http
GET  /api/dashboard
GET  /api/suppliers
POST /api/suppliers
PUT  /api/suppliers/{id}
PUT  /api/suppliers/{id}/status
GET  /api/requisitions
POST /api/requisitions
POST /api/requisitions/{id}/submit
GET  /api/approvals
POST /api/approvals/{id}/decision
GET  /api/rfqs
POST /api/rfqs
POST /api/quotations
POST /api/rfqs/{id}/evaluate
POST /api/awards
GET  /api/purchase-orders
POST /api/grns
GET  /api/reports
```

Additional versioned endpoints exist for auth, users, requisitions, and quotations under `/api/v1/...`.

API documentation:

```text
/api/docs
/v3/api-docs
/swagger-ui.html
```

Protected endpoints require:

```http
Authorization: Bearer <token>
```

## Frontend

The browser UI is served from:

```text
src/main/resources/static
```

It contains static pages and JavaScript modules for login, dashboard, requisitions, approvals, suppliers, RFQs, quotations, purchase orders, reports, notifications, profile, users, system settings, and supplier-facing screens.

## Tests

Run:

```powershell
.\mvnw.cmd test
```

The test profile uses H2 in MySQL compatibility mode and Flyway migrations.

## Notes

- Flyway migration files are in `src/main/resources/db/migration`.
- `ddl-auto` is set to `validate`, so schema changes should be made through migrations.
- `spring.jpa.open-in-view` is disabled.
- Keep real JWT secrets and mail passwords out of committed documentation and scripts.

