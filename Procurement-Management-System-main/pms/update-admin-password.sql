-- Update the admin user with correct BCrypt hash for "Admin@123456"
-- This hash: $2a$10$3qRVVVRuL7fQz4S.jYxC4eJV0qL2gKRBQSsV.mFMHEQ5.cXvBZfny
UPDATE users 
SET password_hash='$2a$10$3qRVVVRuL7fQz4S.jYxC4eJV0qL2gKRBQSsV.mFMHEQ5.cXvBZfny',
    status='ACTIVE',
    approval_limit=999999
WHERE email='admin@digitaldynamics.co.za';

-- Verify
SELECT email, status FROM users WHERE email='admin@digitaldynamics.co.za';
