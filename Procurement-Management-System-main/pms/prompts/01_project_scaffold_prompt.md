# PROMPT 01 - Create Project Scaffold

Create a Maven Spring Boot 3.x project named `digital-dynamics-pms`.

Package root: `com.digitaldynamics.pms`

Create these packages:
- config
- security
- controller
- service
- repository
- model
- dto
- mapper
- exception
- integration

Dependencies:
- spring-boot-starter-web
- spring-boot-starter-security
- spring-boot-starter-data-jpa
- spring-boot-starter-validation
- spring-boot-starter-mail
- mysql-connector-j
- flyway-core or liquibase-core
- jjwt or nimbus-jose-jwt
- springdoc-openapi-starter-webmvc-ui
- lombok optional
- spring-boot-starter-test
- testcontainers for MySQL integration tests

Create:
- `PmsApplication.java`
- `application.yml`
- `application-dev.yml`
- `application-prod.yml`
- health endpoint configuration
- global exception handler
- standard API error response object

Use Java 17 and ensure the project builds with `mvn clean package`.
