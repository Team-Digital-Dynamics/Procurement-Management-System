# Digital Dynamics Procurement Management System

Digital Dynamics Procurement Management System is a private Spring Boot application for managing internal procurement activity from requisition through approval, RFQ, quotation evaluation, purchase order, goods receipt, reporting, and audit review.

The repository contains the full backend service and a static browser interface served by the application module in `pms/`.

## Project Contents

```text
.
|-- application.yml
|-- docker-compose.yml
|-- README.txt
|-- README-old.txt
|-- README-old2.txt
|-- pms/
    |-- Dockerfile
    |-- pom.xml
    |-- mvnw
    |-- mvnw.cmd
    |-- README.txt
    |-- README-old.txt
    |-- README-old2.txt
    |-- src/main/java/com/digitaldynamics/pms/
    |-- src/main/resources/
    |-- src/test/
```

## Technology

- Java 17
- Spring Boot 3.3.6
- Spring Web, Spring Security, Spring Data JPA, Spring Validation, Spring Mail, Spring Actuator, and Spring AOP
- JWT authentication with BCrypt password hashing
- Flyway database migrations
- MySQL for application runtime
- H2 and Testcontainers dependencies for testing
- Maven wrapper
- Static HTML, CSS, and JavaScript frontend
- Springdoc OpenAPI and Swagger UI

## Main Capabilities

- User registration, login, profile management, password reset, and account status handling
- Role-based access for administrators, requesters, approvers, procurement users, receiving users, and suppliers
- Approval threshold configuration and approval decision history
- Requisition creation, submission, approval, and rejection workflows
- RFQ creation and supplier quotation submission
- Weighted quotation evaluation and award support
- Purchase order and goods received note tracking
- Supplier-facing RFQ, quotation, and purchase order screens
- Dashboards, compliance reports, spend reports, and budget views
- Audit logging, backup support, notification pages, and AI assistant resources
- OpenAPI documentation for the REST API

## Run With Docker Compose

From the repository root:

```powershell
$env:PMS_JWT_SECRET="replace-with-a-long-secret-at-least-32-bytes"
$env:PMS_MAIL_PASSWORD="replace-with-mail-password"
docker compose up --build
```

Open:

```text
http://localhost:8080
```

The root compose file uses the application module in `pms/` and a MySQL service for local development.

## Run With Maven

Start a MySQL database first, then run the application from the module directory:

```powershell
cd pms
.\mvnw.cmd spring-boot:run
```

Common environment variables:

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

## Default Seeded Accounts

When the application starts against an empty database, the seeder creates the expected system users when they are missing. The default password is:

```text
Password123!
```

Seeded emails include:

```text
admin@digitaldynamics.co.za
procurement@digitaldynamics.co.za
requester@digitaldynamics.co.za
approver1@digitaldynamics.co.za
approver2@digitaldynamics.co.za
approver3@digitaldynamics.co.za
receiving@digitaldynamics.co.za
```

Change seeded credentials before using the system outside local development.

## API Documentation

After startup, documentation is available at:

```text
http://localhost:8080/api/docs
http://localhost:8080/v3/api-docs
http://localhost:8080/swagger-ui.html
```

Protected API requests require:

```http
Authorization: Bearer <token>
```

## Development Notes

- Application code lives in `pms/src/main/java/com/digitaldynamics/pms`.
- Static frontend pages live in `pms/src/main/resources/static`.
- Flyway migrations live in `pms/src/main/resources/db/migration`.
- Runtime configuration lives in `pms/src/main/resources/application.yml` and profile-specific YAML files.
- Do not commit real JWT secrets, database passwords, or mail credentials.

## Tests

From `pms/`:

```powershell
.\mvnw.cmd test
```

## Proprietary License and Use Restrictions

Copyright (c) 2026 Digital Dynamics. All rights reserved.

This repository, source code, documentation, user interface content, database schema, workflows, text, images, configuration, and related materials are proprietary and confidential unless Digital Dynamics gives express written permission otherwise.

No license is granted to any person or organization to copy, fork, clone for reuse, modify, publish, distribute, sublicense, sell, host, deploy, train on, scrape, extract, reverse engineer, or create derivative works from this project or any of its contents.

Viewing or receiving access to this repository does not transfer ownership and does not grant permission to use the project for personal, academic, commercial, internal, public, or open-source purposes. Any permitted access is limited to the specific purpose approved in writing by Digital Dynamics.

Unauthorized use, reproduction, distribution, or forking of this repository or its contents is prohibited.
