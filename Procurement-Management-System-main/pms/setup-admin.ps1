# This is a BCrypt hash for password "Admin@123456"
# You can generate one with: https://bcrypt-generator.com/ or use Spring's BCryptPasswordEncoder
$bcryptHash = "`$2a`$10`$M85bNp6rqxVnzPHPIR96zOJr0sGtPLmNx7gFo6VZ1aU3xX9mYxZQC"

# Construct the MySQL command
$sqlCommand = @"
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email='admin@pms.local');
DELETE FROM users WHERE email='admin@pms.local';

INSERT INTO users (created_at, updated_at, email, password_hash, full_name, status, failed_login_attempts, approval_limit) 
VALUES (NOW(), NOW(), 'admin@pms.local', '$bcryptHash', 'System Admin', 'ACTIVE', 0, 999999);

INSERT INTO user_roles (user_id, role) 
SELECT id, 'ADMIN' FROM users WHERE email='admin@pms.local';

SELECT 'Setup Complete' as status;
SELECT id, email, status FROM users WHERE email='admin@pms.local';
"@

# Execute against Docker container
$process = docker exec -i pms-mysql-1 mysql -upms -ppms pms
$process | Out-String | Write-Host
$sqlCommand | $process
