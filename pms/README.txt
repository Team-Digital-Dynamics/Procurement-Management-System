# Digital Dynamics PMS Application Module

This directory contains the Spring Boot application module for the Digital Dynamics Procurement Management System. It provides the REST API, security layer, procurement workflow services, persistence layer, database migrations, scheduled workers, mail integration, static frontend, Docker image definition, and tests.

Maven artifact:

```text
com.digitaldynamics:digital-dynamics-pms:0.0.1-SNAPSHOT
```

## Module Layout

```text
pms/
|-- Dockerfile
|-- HELP.md
|-- pom.xml
|-- mvnw
|-- mvnw.cmd
|-- README.txt
|-- README-old.txt
|-- README-old2.txt
|-- scripts/
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
    |       |-- templates/
    |       |-- application.yml
    |       |-- application-dev.yml
    |       |-- application-prod.yml
    |-- test/
```

## Runtime Requirements

- Java 17
- Maven wrapper from this directory
- MySQL 8.x or compatible database for normal runtime
- Docker and Docker Compose for containerized development

## Important Spring Components

- Controllers: authentication, users, requisitions, procurement workflow, quotations, approval thresholds, audits, backups, mail, assistant, and documentation
- Services: business workflow orchestration and security-aware operations
- Repositories: Spring Data JPA persistence
- Models and DTOs: domain entities plus request and response contracts
- Security: JWT-based stateless authentication and role-based authorization
- Migrations: Flyway SQL files in `src/main/resources/db/migration`
- Frontend: static pages and assets in `src/main/resources/static`

## Run This Module

From this directory:

```powershell
$env:PMS_JWT_SECRET="replace-with-a-long-secret-at-least-32-bytes"
$env:PMS_MAIL_PASSWORD="replace-with-mail-password"
.\mvnw.cmd spring-boot:run
```

Open:

```text
http://localhost:8080
```

## Docker Build and Run

From this directory:

```powershell
$env:PMS_JWT_SECRET="replace-with-a-long-secret-at-least-32-bytes"
$env:PMS_MAIL_PASSWORD="replace-with-mail-password"
docker compose up --build
```

## Configuration

Common variables:

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
PMS_MAIL_TEST_RECIPIENT=admindigitaldynamics@gmail.com
```

Keep real secrets outside committed files.

## Frontend Pages

The static UI includes pages for login, dashboards, requisitions, approvals, suppliers, RFQs, quotations, purchase orders, goods receipt capture, reports, audit logs, users, profile, notifications, system settings, and supplier workflows.

## API Access

Authentication starts at:

```http
POST /api/auth/login
```

Send the returned JWT on protected requests:

```http
Authorization: Bearer <token>
```

Documentation endpoints:

```text
/api/docs
/v3/api-docs
/swagger-ui.html
```

## Database

Schema changes should be made through Flyway migrations in:

```text
src/main/resources/db/migration
```

Current migration set:

```text
V1__initial_schema.sql
V2__create_notifications_table.sql
V3__add_evaluation_records.sql
V4__enhance_audit_logs.sql
V5__create_approval_thresholds.sql
```

## Tests

Run:

```powershell
.\mvnw.cmd test
```

## Proprietary License and Use Restrictions

Copyright (c) 2026 Digital Dynamics. All rights reserved.

This module and all related source code, documentation, static assets, templates, database migrations, interface text, workflows, and configuration are proprietary and confidential unless Digital Dynamics gives express written permission otherwise.

No permission is granted to copy, fork, clone for reuse, modify, publish, distribute, sublicense, sell, host, deploy, train on, scrape, extract, reverse engineer, or create derivative works from this module or any of its contents.

Access to this module is limited to the specific purpose approved in writing by Digital Dynamics. Unauthorized use, reproduction, redistribution, or forking is prohibited.
