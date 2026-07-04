#!/bin/bash
docker exec pms-mysql-1 mysql -upms -ppms pms -e "
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email='admin@pms.local');
DELETE FROM users WHERE email='admin@pms.local';

INSERT INTO users (created_at, updated_at, email, password_hash, full_name, status, failed_login_attempts, approval_limit) 
VALUES (NOW(), NOW(), 'admin@pms.local', '\$2a\$10\$HEZ6eKNaJI7hL3tJ8k2Yse2d2vJ8k2Yse2d2vJ8k2Yse2d2vJ8k2Y', 'System Admin', 'ACTIVE', 0, 999999);

INSERT INTO user_roles (user_id, role) 
SELECT id, 'ADMIN' FROM users WHERE email='admin@pms.local';

SELECT 'User created:' as status;
SELECT id, email, status FROM users WHERE email='admin@pms.local';
SELECT 'Roles:' as roles_label;
SELECT user_id, role FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email='admin@pms.local');
"
