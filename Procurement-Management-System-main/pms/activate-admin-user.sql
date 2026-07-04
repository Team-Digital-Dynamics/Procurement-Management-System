-- Activate the admin user and assign ADMIN role
UPDATE users SET status='ACTIVE', approval_limit=999999 WHERE email='admin@digitaldynamics.co.za';

-- Get the user ID and assign ADMIN role
INSERT INTO user_roles (user_id, role) 
SELECT id, 'ADMIN' FROM users WHERE email='admin@digitaldynamics.co.za' 
ON DUPLICATE KEY UPDATE role='ADMIN';

-- Verify the changes
SELECT id, email, status FROM users WHERE email='admin@digitaldynamics.co.za';
SELECT ur.user_id, ur.role FROM user_roles ur JOIN users u ON ur.user_id = u.id WHERE u.email='admin@digitaldynamics.co.za';
