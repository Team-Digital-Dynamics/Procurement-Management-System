-- Delete the existing admin user that's causing issues
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email='admin@digitaldynamics.co.za');
DELETE FROM users WHERE email='admin@digitaldynamics.co.za';

-- Create a fresh admin user with known working password
-- Password: Admin@123456
-- BCrypt Hash: $2a$12$R9h7cIPz0gi.URNN3kh2OPST9/PgBkqquzi8Ss8KIUgO2xT/tYM4K
INSERT INTO users (created_at, updated_at, email, password_hash, full_name, status, failed_login_attempts, approval_limit) 
VALUES (NOW(), NOW(), 'admin@digitaldynamics.co.za', '$2a$12$R9h7cIPz0gi.URNN3kh2OPST9/PgBkqquzi8Ss8KIUgO2xT/tYM4K', 'System Administrator', 'ACTIVE', 0, 999999);

-- Assign ADMIN role
INSERT INTO user_roles (user_id, role)
SELECT id, 'ADMIN' FROM users WHERE email='admin@digitaldynamics.co.za';

-- Verify setup
SELECT email, status FROM users WHERE email='admin@digitaldynamics.co.za';
SELECT 'Setup complete' as status;
