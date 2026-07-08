-- Procurement Management System database backup
-- Source: SCHEDULED
-- Created at UTC: 2026-07-08T09:18:23.450132600Z

DELETE FROM `users`;
DELETE FROM `user_roles`;
DELETE FROM `suppliers`;
DELETE FROM `rfqs`;
DELETE FROM `requisitions`;
DELETE FROM `requisition_items`;
DELETE FROM `quotations`;
DELETE FROM `purchase_orders`;
DELETE FROM `notifications`;
DELETE FROM `goods_received_notes`;
DELETE FROM `evaluation_records`;
DELETE FROM `audit_logs`;
DELETE FROM `approvals`;












INSERT INTO `user_roles` (`user_id`, `role`) VALUES (1, 'ADMIN');
INSERT INTO `user_roles` (`user_id`, `role`) VALUES (2, 'PROCUREMENT_OFFICER');
INSERT INTO `user_roles` (`user_id`, `role`) VALUES (3, 'REQUESTER');
INSERT INTO `user_roles` (`user_id`, `role`) VALUES (4, 'APPROVER_LEVEL_1');
INSERT INTO `user_roles` (`user_id`, `role`) VALUES (5, 'APPROVER_LEVEL_2');
INSERT INTO `user_roles` (`user_id`, `role`) VALUES (6, 'APPROVER_LEVEL_3');
INSERT INTO `user_roles` (`user_id`, `role`) VALUES (7, 'RECEIVING_CLERK');

INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (1, '2026-07-08T11:18:22.780690', '2026-07-08T11:18:22.780690', 'admin@digitaldynamics.co.za', '$2a$10$OUzRlhFc9tjskGm04h4bJetqQASiTqyuPw24rnibQ7mPjr4aJIrNy', 'Backup Verified Admin', 'ACTIVE', 0, 1000000.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (2, '2026-07-08T11:18:22.894887', '2026-07-08T11:18:22.894887', 'procurement@digitaldynamics.co.za', '$2a$10$H1VC1wiHtjz6awoJuKAh7u0RXtXHMHUmVyqK.uM5lUqbFCv5alXCG', 'Procurement Officer', 'ACTIVE', 0, 0.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (3, '2026-07-08T11:18:22.956242', '2026-07-08T11:18:22.956242', 'requester@digitaldynamics.co.za', '$2a$10$VtP0ZipP5BT.yahCyjnOsua9WIgfTWHHCsAaH/Lt1WCWp9ygEyO2K', 'Requester User', 'ACTIVE', 0, 0.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (4, '2026-07-08T11:18:23.016757', '2026-07-08T11:18:23.016757', 'approver1@digitaldynamics.co.za', '$2a$10$N5I9p.bJ0xECJ7ylzb76FeTZq8g1kiDgut0W4MBGzNxgNd1Vw3SuG', 'Level 1 Approver', 'ACTIVE', 0, 25000.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (5, '2026-07-08T11:18:23.075761', '2026-07-08T11:18:23.075761', 'approver2@digitaldynamics.co.za', '$2a$10$MaqmvTxhVUvCIYEo5Xqm1uG43YeGZZHkT.CwJxAZDYrFfOD37jwzi', 'Level 2 Approver', 'ACTIVE', 0, 100000.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (6, '2026-07-08T11:18:23.136042', '2026-07-08T11:18:23.136042', 'approver3@digitaldynamics.co.za', '$2a$10$3BWxTNpbKf5pOxsmAGWRauOwp4EYwVj2hr/KScg5df1xbgkeYQNRG', 'Level 3 Approver', 'ACTIVE', 0, 1000000.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (7, '2026-07-08T11:18:23.195216', '2026-07-08T11:18:23.195216', 'receiving@digitaldynamics.co.za', '$2a$10$FeVroobPX0LnOqvfcwUxOuL.AUgRUF/GeIevBmbPUYOp1ivvxXvgu', 'Receiving Clerk', 'ACTIVE', 0, 0.00);

