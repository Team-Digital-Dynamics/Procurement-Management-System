# MASTER BUILD PROMPT - Procurement Management System

You are building the Digital Dynamics Procurement Management System (PMS) from a formal system design.

Build a production-ready Spring Boot 3.x application using Java 17, MySQL 8, Spring Security, Spring Data JPA, BCrypt, JWT authentication, and a browser UI using HTML5, CSS3/Tailwind, and vanilla JavaScript only. Do not use React, Angular, Vue, or NoSQL.

The PMS must digitise the full procurement lifecycle:
- User registration, authentication, role assignment, profile management, account locking.
- Requisition creation, submission, tracking, and status management.
- Multi-level approval routing based on value thresholds and role authority.
- RFQ creation from approved requisitions.
- Approved supplier register and supplier status management.
- Supplier quotation submission through a limited portal.
- Weighted quote evaluation using price, delivery, quality, terms, and supplier performance.
- Purchase order generation from the winning quotation.
- Goods received note capture and discrepancy flagging.
- Insert-only audit logging for all significant actions.
- Role-specific dashboards, reports, notifications, and chatbot assistance.

Critical architecture rules:
- Layered architecture: controller, service, repository, model, dto, mapper, exception, config, security, integration.
- Controllers only map HTTP requests and validate DTOs.
- Services own business rules and transactional boundaries.
- Repositories use Spring Data JPA.
- All permission decisions happen server-side.
- The frontend may hide menus by role, but must never be trusted for authority.
- All passwords must be BCrypt hashes.
- Audit logs are insert-only. Do not add update/delete endpoints for audit logs.
- Self-approval is forbidden.
- Suppliers may submit only to open RFQs before deadline.
- Late quotations must be rejected.
- RFQ evaluation weights must total 100%.
- Override of recommended supplier requires written justification.
- GRNs must reconcile received items against the purchase order.
- POPIA principles: collect only necessary data, restrict access, log access and changes.

Deliverables:
1. Complete Maven project.
2. Dockerfile for backend.
3. docker-compose.yml with app and MySQL.
4. Flyway or Liquibase database migrations.
5. Seed data for all roles.
6. OpenAPI endpoint documentation.
7. Unit tests and integration tests.
8. Static frontend under `src/main/resources/static`.
9. README with run instructions.

Do not produce placeholder-only code. Implement real endpoints, services, entities, validation, tests, and Docker startup.
