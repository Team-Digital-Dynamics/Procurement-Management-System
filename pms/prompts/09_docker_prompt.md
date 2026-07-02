# PROMPT 09 - Docker and Runtime

Create a Docker setup:

Backend Dockerfile:
- Multi-stage build using Maven and Eclipse Temurin Java 17.
- Build with `mvn clean package -DskipTests`.
- Runtime image with Java 17 JRE.
- Run app on port 8080.

Docker Compose:
- mysql service using mysql:8.4 or mysql:8.
- app service built from backend Dockerfile.
- MySQL volume.
- Environment variables for DB URL, username, password, JWT secret, SMTP, AI API.
- Healthcheck for MySQL and app.
- App depends on healthy DB.

Add `.env.example` and README instructions:
- docker compose up --build
- app URL: http://localhost:8080
- swagger URL: http://localhost:8080/swagger-ui.html or /swagger-ui/index.html

Do not store real secrets in the repo.
