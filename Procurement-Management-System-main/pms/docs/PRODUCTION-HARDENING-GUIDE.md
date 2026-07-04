# Production Security Hardening Guide
**Digital Dynamics PMS - Deployment Checklist**

---

## Quick Summary

This guide walks through hardening the Procurement Management System from development to production. All items must be completed before production deployment.

---

## Phase 1: Secrets & Credentials Management

### 1.1 Generate Strong Secrets

```bash
# Generate JWT Secret (must be ≥32 bytes)
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET"

# Generate Database Passwords
DB_USER_PASSWORD=$(openssl rand -base64 16)
DB_ROOT_PASSWORD=$(openssl rand -base64 16)
echo "DB_USER_PASSWORD=$DB_USER_PASSWORD"
echo "DB_ROOT_PASSWORD=$DB_ROOT_PASSWORD"

# Generate SSL Keystore Password (if using TLS)
KEYSTORE_PASSWORD=$(openssl rand -base64 12)
echo "KEYSTORE_PASSWORD=$KEYSTORE_PASSWORD"
```

### 1.2 Store Secrets Securely

**Option A: HashiCorp Vault** (Recommended)

```bash
# Authenticate to Vault
vault login -method=ldap username=admin

# Store secrets
vault kv put secret/pms/prod \
  jwt_secret="$JWT_SECRET" \
  db_username="pms_prod" \
  db_password="$DB_USER_PASSWORD" \
  db_root_password="$DB_ROOT_PASSWORD"

# Retrieve in application
vault kv get -format=json secret/pms/prod | jq .data.data
```

**Option B: AWS Secrets Manager**

```bash
aws secretsmanager create-secret \
  --name pms/prod/jwt_secret \
  --secret-string "$JWT_SECRET"

aws secretsmanager create-secret \
  --name pms/prod/database \
  --secret-string "{\"username\":\"pms_prod\",\"password\":\"$DB_USER_PASSWORD\"}"
```

**Option C: Azure Key Vault**

```bash
az keyvault secret set --vault-name pms-prod \
  --name jwt-secret \
  --value "$JWT_SECRET"

az keyvault secret set --vault-name pms-prod \
  --name db-password \
  --value "$DB_USER_PASSWORD"
```

**Option D: Environment Files (Development Only)**

```bash
# .env.prod (NEVER commit to version control)
PMS_JWT_SECRET="..."
SPRING_DATASOURCE_PASSWORD="..."
PMS_DB_ROOT_PASSWORD="..."
SSL_KEYSTORE_PASSWORD="..."
```

Add to `.gitignore`:
```
.env.prod
.env.production
secrets/
*.key
*.p12
*.jks
```

### 1.3 Update docker-compose.yml for Production

**Current (Development)**:
```yaml
environment:
  MYSQL_PASSWORD: pms
  MYSQL_ROOT_PASSWORD: Password1238
  PMS_JWT_SECRET: change-this-development-secret-that-is-at-least-32-bytes
```

**Production**:
```yaml
environment:
  MYSQL_PASSWORD: ${SPRING_DATASOURCE_PASSWORD}
  MYSQL_ROOT_PASSWORD: ${PMS_DB_ROOT_PASSWORD}
  PMS_JWT_SECRET: ${PMS_JWT_SECRET}
```

---

## Phase 2: Application Configuration Hardening

### 2.1 Update application-prod.yml

**Location**: `src/main/resources/application-prod.yml`

```yaml
spring:
  application:
    name: digital-dynamics-pms
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
    properties:
      hibernate:
        jdbc:
          batch_size: 20
          fetch_size: 50
        order_inserts: true
        order_updates: true
  flyway:
    enabled: true
    locations: classpath:db/migration
    validate-on-migrate: true
    out-of-order: false
  mail:
    host: ${PMS_MAIL_HOST}
    port: ${PMS_MAIL_PORT}
    username: ${PMS_MAIL_USERNAME}
    password: ${PMS_MAIL_PASSWORD}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
            required: true

server:
  port: 8080
  ssl:
    enabled: true
    key-store: ${SSL_KEYSTORE_PATH}
    key-store-password: ${SSL_KEYSTORE_PASSWORD}
    key-store-type: PKCS12
    key-alias: tomcat
  error:
    include-message: never
    include-stacktrace: never
    include-exception: false
  compression:
    enabled: true
    min-response-size: 1024
  shutdown: graceful
  servlet:
    session:
      tracking-modes: cookie
      cookie:
        secure: true
        http-only: true
        same-site: lax

management:
  health:
    mail:
      enabled: false
  endpoints:
    web:
      exposure:
        include: health,info
      base-path: /actuator
  endpoint:
    health:
      probes:
        enabled: true
      show-details: when_authorized
    info:
      enabled: true

pms:
  jwt:
    secret: ${PMS_JWT_SECRET}
    expiration-minutes: ${PMS_JWT_EXPIRATION_MINUTES:480}

logging:
  level:
    com.digitaldynamics.pms: INFO
    org.springframework.security: WARN
    org.springframework.data: WARN
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
  file:
    name: /var/log/pms/application.log
    max-size: 100MB
    max-history: 30
    total-size-cap: 1GB
```

### 2.2 Enable HTTPS/TLS

**Generate Self-Signed Certificate** (for testing):

```bash
keytool -genkey -alias tomcat -keyalg RSA -keysize 2048 \
  -keystore keystore.p12 -storetype PKCS12 \
  -storepass "$KEYSTORE_PASSWORD" \
  -validity 365 \
  -dname "CN=pms.example.com,O=Digital Dynamics,C=US"
```

**Or Use Let's Encrypt** (recommended for production):

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d pms.example.com

# Convert to PKCS12 (for Java)
openssl pkcs12 -export \
  -in /etc/letsencrypt/live/pms.example.com/fullchain.pem \
  -inkey /etc/letsencrypt/live/pms.example.com/privkey.pem \
  -out keystore.p12 \
  -name tomcat \
  -password pass:"$KEYSTORE_PASSWORD"
```

**Mount Certificate in Docker**:

```yaml
services:
  app:
    volumes:
      - ./keystore.p12:/secrets/keystore.p12:ro
    environment:
      SSL_KEYSTORE_PATH: /secrets/keystore.p12
      SSL_KEYSTORE_PASSWORD: ${SSL_KEYSTORE_PASSWORD}
```

---

## Phase 3: Database Hardening

### 3.1 Create Production Database User

```sql
-- Connect as root
mysql -uroot -p$DB_ROOT_PASSWORD

-- Create production user with limited privileges
CREATE USER 'pms_prod'@'%' IDENTIFIED BY '<STRONG_PASSWORD>';

-- Grant only necessary permissions on the pms database
GRANT SELECT, INSERT, UPDATE, DELETE ON pms.* TO 'pms_prod'@'%';

-- Disable unnecessary privileges
REVOKE CREATE, ALTER, DROP, INDEX ON pms.* FROM 'pms_prod'@'%';
REVOKE GRANT OPTION ON pms.* FROM 'pms_prod'@'%';

-- Do NOT grant SUPER, PROCESS, FILE, RELOAD privileges
FLUSH PRIVILEGES;

-- Verify permissions
SHOW GRANTS FOR 'pms_prod'@'%';
```

### 3.2 Enable MySQL Encryption

**For InnoDB Transparent Page Encryption**:

```sql
-- Connect as root
SET GLOBAL innodb_encrypt_tables=ON;
SET GLOBAL innodb_encrypt_log=ON;

-- Verify
SHOW VARIABLES LIKE 'innodb_encrypt%';
```

**For Backup Encryption** (on backup host):

```bash
# Before encryption
mysqldump -upms_prod -p$DB_PASSWORD pms > backup.sql

# Encrypt with GPG
gpg --symmetric --cipher-algo AES256 backup.sql

# Backup now encrypted as backup.sql.gpg
# Store GPG key separately in key vault
```

### 3.3 Configure Backup Storage

**S3 Bucket (AWS)**:

```bash
# Create bucket
aws s3 mb s3://pms-backups-prod --region us-east-1

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket pms-backups-prod \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket pms-backups-prod \
  --versioning-configuration Status=Enabled

# Enable MFA Delete
aws s3api put-bucket-versioning \
  --bucket pms-backups-prod \
  --versioning-configuration Status=Enabled,MFADelete=Enabled

# Block all public access
aws s3api put-public-access-block \
  --bucket pms-backups-prod \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

**Update Backup Script for S3**:

```powershell
# Add after mysqldump in backup-mysql.ps1
$BackupFile = "pms_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
$S3Bucket = "s3://pms-backups-prod"
$S3Key = "$(Get-Date -Format 'yyyy/MM/dd')/$BackupFile"

# Upload to S3
aws s3 cp "$BackupDir\$BackupFile" "$S3Bucket/$S3Key" `
  --sse AES256 `
  --storage-class STANDARD_IA

Write-Host "Backup uploaded to S3: $S3Bucket/$S3Key"
```

---

## Phase 4: Network Security

### 4.1 Firewall Rules

**Inbound (Allow)**:
- Port 443 (HTTPS): From anywhere (CDN/WAF)
- Port 8080 (HTTP): From load balancer only (internal redirect to HTTPS)
- Port 3306 (MySQL): From application container only

**Outbound (Allow)**:
- Port 443 (HTTPS): For external APIs, package updates
- Port 25, 587 (SMTP): For email notifications
- Port 53 (DNS): For DNS resolution

**Block Everything Else**

### 4.2 Database Port Security

**Restrict MySQL Access**:

```yaml
# docker-compose.yml
services:
  mysql:
    ports:
      - "127.0.0.1:3306:3306"  # Only accessible from localhost in dev
    networks:
      - pms_network  # Internal network only in prod

  app:
    networks:
      - pms_network

networks:
  pms_network:
    driver: bridge
    driver_opts:
      com.docker.network.bridge.name: br_pms
```

### 4.3 API Rate Limiting

**Configure in SecurityConfig.java**:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    SecurityFilterChain securityFilterChain(
        HttpSecurity http,
        JwtAuthenticationFilter jwtFilter,
        RateLimitingFilter rateLimitFilter
    ) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            // ... rest of config
            .build();
    }
}
```

**Create RateLimitingFilter.java**:

```java
@Component
public class RateLimitingFilter extends OncePerRequestFilter {
    private final RateLimiter rateLimiter = 
        RateLimiter.create(100.0); // 100 requests per second
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response,
                                    FilterChain filterChain) 
            throws ServletException, IOException {
        
        if (!rateLimiter.tryAcquire()) {
            response.sendError(HttpServletResponse.SC_TOO_MANY_REQUESTS,
                "Rate limit exceeded");
            return;
        }
        
        filterChain.doFilter(request, response);
    }
}
```

---

## Phase 5: Monitoring & Logging

### 5.1 Centralized Logging

**ELK Stack Setup** (Elasticsearch, Logstash, Kibana):

```yaml
# docker-compose.yml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
    environment:
      discovery.type: single-node
      xpack.security.enabled: true
      ELASTIC_PASSWORD: ${ES_PASSWORD}
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.0.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    environment:
      ELASTICSEARCH_HOSTS: "https://elasticsearch:9200"
      ELASTICSEARCH_USERNAME: elastic
      ELASTICSEARCH_PASSWORD: ${ES_PASSWORD}
      ELASTICSEARCH_SSL_VERIFICATIONMODE: none

  kibana:
    image: docker.elastic.co/kibana/kibana:8.0.0
    environment:
      ELASTICSEARCH_HOSTS: https://elasticsearch:9200
      ELASTICSEARCH_USERNAME: elastic
      ELASTICSEARCH_PASSWORD: ${ES_PASSWORD}
    ports:
      - "5601:5601"

volumes:
  elasticsearch_data:
```

**Logback Configuration** (send logs to Logstash):

```xml
<!-- src/main/resources/logback-spring.xml -->
<configuration>
  <appender name="LOGSTASH" class="net.logstash.logback.appender.LogstashTcpSocketAppender">
    <destination>logstash:5000</destination>
    <encoder class="net.logstash.logback.encoder.LogstashEncoder">
      <timeZone>UTC</timeZone>
      <version>1</version>
    </encoder>
  </appender>

  <root level="INFO">
    <appender-ref ref="LOGSTASH"/>
  </root>
</configuration>
```

### 5.2 Security Monitoring Alerts

**Set Up Alerts in Kibana**:

1. **Failed Login Attempts** (>5 in 1 hour):
```
Filter: action:LOGIN AND status:FAILED
Time window: 1 hour
Threshold: > 5
Alert: Send email to security@company.com
```

2. **Account Lockouts**:
```
Filter: action:LOCK_ACCOUNT
Time window: 5 minutes
Threshold: > 1
Alert: Immediate email to ops team
```

3. **Unusual Database Queries**:
```
Filter: database_query:DROP OR database_query:TRUNCATE OR database_query:DELETE
Time window: 5 minutes
Threshold: > 0
Alert: Immediate SMS to DBA
```

4. **High Error Rates**:
```
Filter: status:500 OR status:502
Time window: 5 minutes
Threshold: > 10
Alert: Page on-call engineer
```

---

## Phase 6: Disaster Recovery

### 6.1 Backup Verification Job

**Scheduled Daily**: Restore from previous day's backup to test environment

```bash
#!/bin/bash
# /scripts/verify-backup.sh

BACKUP_DATE=$(date -d "1 day ago" +%Y%m%d)
BACKUP_FILE="s3://pms-backups-prod/*/pms_${BACKUP_DATE}*.sql.gpg"

# Download and decrypt
aws s3 cp "$BACKUP_FILE" /tmp/latest_backup.sql.gpg
gpg --decrypt --output /tmp/latest_backup.sql /tmp/latest_backup.sql.gpg

# Create test database
TEST_DB="pms_test_$(date +%s)"
mysql -uroot -p$ROOT_PASSWORD -e "CREATE DATABASE $TEST_DB;"

# Restore
mysql -uroot -p$ROOT_PASSWORD $TEST_DB < /tmp/latest_backup.sql

# Validate
mysql -uroot -p$ROOT_PASSWORD -e "SELECT COUNT(*) FROM $TEST_DB.users;"

# Cleanup
mysql -uroot -p$ROOT_PASSWORD -e "DROP DATABASE $TEST_DB;"
rm /tmp/latest_backup.sql /tmp/latest_backup.sql.gpg
```

**Schedule in crontab**:

```cron
# Run daily at 3 AM UTC
0 3 * * * /scripts/verify-backup.sh >> /var/log/backup-verify.log 2>&1
```

### 6.2 Disaster Recovery Plan

**Document**: `docs/SEC-2-DISASTER-RECOVERY-PLAN.md`

Include:
- [ ] RTO/RPO targets for each scenario
- [ ] Step-by-step recovery procedures
- [ ] Contact list for incident response
- [ ] Quarterly DR drill schedule
- [ ] Backup location and access credentials (secure)

---

## Phase 7: Compliance & Audit

### 7.1 Security Audit Log Review

**Monthly Security Review** (1st of each month):

```sql
SELECT 
    DATE(created_at) as event_date,
    action,
    COUNT(*) as event_count
FROM audit_logs
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
GROUP BY DATE(created_at), action
ORDER BY event_date DESC, event_count DESC;
```

**Investigate Anomalies**:

```sql
-- Failed logins by user
SELECT actor, COUNT(*) as failed_attempts
FROM audit_logs
WHERE action = 'LOGIN_FAILED'
  AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY actor
HAVING COUNT(*) > 5;

-- Account lockouts
SELECT * FROM audit_logs
WHERE action = 'LOCK_ACCOUNT'
  AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);

-- Unusual access patterns
SELECT actor, DATE(created_at) as access_date, COUNT(*) as access_count
FROM audit_logs
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
GROUP BY actor, DATE(created_at)
HAVING COUNT(*) > 100;
```

### 7.2 Regulatory Compliance

**GDPR Compliance**:
- [ ] Data retention policy documented
- [ ] Right to deletion implemented (GDPR right to be forgotten)
- [ ] Data export functionality for subjects
- [ ] Privacy notice in system

**SOC 2 Compliance**:
- [ ] Access controls documented and tested
- [ ] Change management process established
- [ ] Incident response plan in place
- [ ] System monitoring and alerting active

**PCI DSS (if handling payment data)**:
- [ ] Encrypted connections (TLS 1.2+)
- [ ] No storage of full card numbers
- [ ] Regular security testing
- [ ] Quarterly assessments

---

## Phase 8: Deployment Checklist

### Pre-Deployment

- [ ] All secrets generated and stored in vault
- [ ] Docker image built and security scanned
- [ ] Database backup created and verified
- [ ] Recovery procedure tested
- [ ] All team members trained
- [ ] Incident response plan reviewed
- [ ] On-call schedule established
- [ ] Monitoring dashboard configured
- [ ] Logging aggregation verified
- [ ] HTTPS certificates installed

### Deployment Day

- [ ] Backup current production database
- [ ] Deploy new container image
- [ ] Verify application health: `curl https://pms.example.com/actuator/health`
- [ ] Run smoke tests (login, create requisition, approve)
- [ ] Monitor application logs for errors
- [ ] Check database connectivity
- [ ] Verify backups are running
- [ ] Test at least one recovery procedure

### Post-Deployment

- [ ] Monitor error rates for 24 hours
- [ ] Review security audit logs
- [ ] Verify backup job executed successfully
- [ ] Document any issues encountered
- [ ] Schedule post-mortem review meeting

---

## Quick Reference: Environment Variables

```bash
# Database
SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/pms?useSSL=true&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=pms_prod
SPRING_DATASOURCE_PASSWORD=[VAULT_RETRIEVED]

# JWT
PMS_JWT_SECRET=[VAULT_RETRIEVED]
PMS_JWT_EXPIRATION_MINUTES=480

# SSL
SSL_KEYSTORE_PATH=/secrets/keystore.p12
SSL_KEYSTORE_PASSWORD=[VAULT_RETRIEVED]

# Mail
PMS_MAIL_HOST=smtp.example.com
PMS_MAIL_PORT=587
PMS_MAIL_USERNAME=[VAULT_RETRIEVED]
PMS_MAIL_PASSWORD=[VAULT_RETRIEVED]

# Root DB (for migrations/admin)
PMS_DB_ROOT_PASSWORD=[VAULT_RETRIEVED]
```

---

## Support & Contact

For questions or issues during hardening:
- **Security Team**: security@company.com
- **DevOps Team**: devops@company.com
- **Database Admin**: dba@company.com

---

**Last Updated**: 2026-07-04  
**Version**: 1.0  
**Classification**: Internal Use Only
