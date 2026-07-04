# AI Development Guidelines - Procurement Management System

Use these guidelines whenever prompting an AI assistant to modify, review, test, or document this project. They are intended to keep future work aligned with the PMS architecture, business rules, and assignment scope.

## 1. Start From The Existing Project

- Inspect the current code before suggesting or making changes.
- Preserve the Spring Boot layered structure: `controller`, `service`, `repository`, `model`, `dto`, `mapper`, `exception`, `config`, `security`, and `integration`.
- Prefer existing naming, package layout, DTO patterns, and service conventions.
- Do not introduce a new framework, runtime, database, or frontend stack unless explicitly requested and justified.
- Keep changes focused on the requested feature or defect.

## 2. Protect Core Architecture Boundaries

- Controllers should map HTTP requests, validate input, and delegate to services.
- Services should contain business rules, workflow transitions, authorization-sensitive decisions, and transactional boundaries.
- Repositories should remain Spring Data JPA interfaces unless a custom query is genuinely needed.
- Entities should model persistence concerns; API responses should go through DTOs.
- Frontend code may improve usability, but server-side authorization and validation must remain authoritative.

## 3. Preserve Procurement Workflow Rules

- Requisitions must follow valid status transitions.
- Self-approval is forbidden.
- Approval routing must respect value thresholds and role authority.
- RFQs must be created only from approved requisitions.
- Suppliers may quote only on open RFQs before the deadline.
- Late or duplicate quotations must be rejected.
- Quotation evaluation weights must total 100%.
- Award overrides must require written justification.
- Purchase orders must come from awarded quotations.
- Goods received notes must reconcile received quantities against purchase order items.
- Audit logs must be insert-only.

## 4. Treat Security As Non-Negotiable

- Enforce role-based access control on every protected endpoint.
- Never rely on hidden frontend controls for permission decisions.
- Never return password hashes, JWT secrets, or sensitive supplier banking details in general API responses.
- Use BCrypt for passwords.
- Keep JWT configuration externalized and require strong production secrets.
- Avoid leaking stack traces or internal implementation details in API errors.
- Log significant business actions through the audit service.

## 5. Keep Data And Compliance Sensible

- Collect only data needed for the procurement workflow.
- Restrict sensitive supplier and user information to authorized roles.
- Maintain traceability for approvals, awards, overrides, receipts, and administrative changes.
- Prefer explicit validation over accepting partial or ambiguous business data.
- Respect POPIA-aligned principles: minimal collection, access restriction, accountability, and auditability.

## 6. Testing Expectations

- Add or update tests for every meaningful behavior change.
- Cover workflow transitions, RBAC, validation failures, and audit side effects when relevant.
- Keep tests deterministic and isolated.
- Run `.\mvnw.cmd test` from the `pms` directory after backend changes when practical.
- If tests cannot be run, state the reason and identify the risk.

## 7. Frontend Expectations

- Keep the frontend static: HTML, CSS, and vanilla JavaScript.
- Do not add React, Angular, Vue, or a frontend build pipeline.
- Match the existing interface style and role-specific workflows.
- Keep screens practical for procurement tasks: clear tables, forms, statuses, actions, and feedback.
- Ensure frontend changes still work with the existing REST API and JWT flow.

## 8. Database And Migration Rules

- Use Flyway migrations for schema changes.
- Do not edit old migrations after they have been treated as applied; add a new migration instead.
- Keep constraints, indexes, and relationships aligned with the business rules.
- Seed data should support testing and demonstration without exposing real credentials.

## 9. Documentation Rules

- Update README or prompt documentation when setup, endpoints, roles, workflow behavior, or configuration changes.
- Keep instructions runnable on Windows PowerShell because the project uses `mvnw.cmd`.
- Document new environment variables and production assumptions.
- Prefer concise, accurate documentation over broad marketing descriptions.

## 10. AI Response Rules

- State assumptions before acting when requirements are ambiguous.
- Prefer implementing a complete, working change over producing placeholder code.
- Explain what changed and how it was verified.
- Mention files changed and tests run.
- Do not silently remove existing functionality.
- Do not overwrite user work or unrelated files.
- If a requested change conflicts with these guidelines, flag the conflict and suggest the smallest safe alternative.

## Suggested Prompt Prefix

When asking an AI assistant to work on this project, prepend this instruction:

```text
Follow pms/prompts/AI_DEVELOPMENT_GUIDELINES.md and preserve the existing Spring Boot, MySQL, JWT, Flyway, and static frontend architecture. Make focused changes, keep procurement workflow rules intact, update tests and docs when relevant, and report what you changed plus how you verified it.
```
