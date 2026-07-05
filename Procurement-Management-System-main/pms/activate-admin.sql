UPDATE users SET status='ACTIVE', approval_limit=999999 WHERE email='admin@pms.local';
INSERT IGNORE INTO user_roles (user_id, role) SELECT id, 'ADMIN' FROM users WHERE email='admin@pms.local' AND id NOT IN (SELECT user_id FROM user_roles WHERE email='admin@pms.local' AND role='ADMIN');
SELECT email, status FROM users WHERE email='admin@pms.local';
SELECT * FROM user_roles WHERE role='ADMIN' LIMIT 3;
