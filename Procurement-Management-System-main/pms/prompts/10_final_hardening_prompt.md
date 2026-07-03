# PROMPT 10 - Final Hardening

Review and harden the PMS:
- Confirm every endpoint has role restrictions.
- Confirm DTOs never expose password_hash or banking_details except to authorised roles.
- Confirm audit logs cannot be updated or deleted through code or API.
- Confirm exception handler does not leak stack traces.
- Confirm all write operations create audit logs.
- Confirm all business transitions validate current status.
- Confirm pagination exists on list endpoints.
- Confirm OpenAPI docs are accurate.
- Confirm Docker Compose starts cleanly from a blank machine.
- Confirm tests pass with `mvn test`.
- Confirm README explains local, Docker, and production configuration.
