-- Procurement Management System database backup
-- Source: SCHEDULED
-- Created at UTC: 2026-07-08T18:24:31.290122400Z

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
DELETE FROM `approval_thresholds`;

INSERT INTO `approval_thresholds` (`id`, `created_at`, `updated_at`, `approval_level`, `approver_role`, `min_amount`, `max_amount`, `description`) VALUES (1, '2026-07-08T20:24:24.788420', '2026-07-08T20:24:24.788420', 1, 'APPROVER_LEVEL_1', 0.00, 25000.00, 'Level 1 approval for low-value requisitions.');
INSERT INTO `approval_thresholds` (`id`, `created_at`, `updated_at`, `approval_level`, `approver_role`, `min_amount`, `max_amount`, `description`) VALUES (2, '2026-07-08T20:24:24.788420', '2026-07-08T20:24:24.788420', 2, 'APPROVER_LEVEL_2', 25000.01, 100000.00, 'Level 2 approval for medium-value requisitions.');
INSERT INTO `approval_thresholds` (`id`, `created_at`, `updated_at`, `approval_level`, `approver_role`, `min_amount`, `max_amount`, `description`) VALUES (3, '2026-07-08T20:24:24.788420', '2026-07-08T20:24:24.788420', 3, 'APPROVER_LEVEL_3', 100000.01, NULL, 'Level 3 approval for high-value requisitions.');












INSERT INTO `user_roles` (`user_id`, `role`) VALUES (1, 'ADMIN');
INSERT INTO `user_roles` (`user_id`, `role`) VALUES (2, 'PROCUREMENT_OFFICER');
INSERT INTO `user_roles` (`user_id`, `role`) VALUES (3, 'REQUESTER');
INSERT INTO `user_roles` (`user_id`, `role`) VALUES (4, 'APPROVER_LEVEL_1');
INSERT INTO `user_roles` (`user_id`, `role`) VALUES (5, 'APPROVER_LEVEL_2');
INSERT INTO `user_roles` (`user_id`, `role`) VALUES (6, 'APPROVER_LEVEL_3');
INSERT INTO `user_roles` (`user_id`, `role`) VALUES (7, 'RECEIVING_CLERK');

INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (1, '2026-07-08T20:24:30.425289', '2026-07-08T20:24:30.425289', 'admin@digitaldynamics.co.za', '$2a$10$QAdqjlPNcswd/da2S8Wq6OIeHAXegmTnKQI5WPT/6nu7a9a6Wi.1m', 'Backup Verified Admin', 'ACTIVE', 0, 1000000.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (2, '2026-07-08T20:24:30.542768', '2026-07-08T20:24:30.542768', 'procurement@digitaldynamics.co.za', '$2a$10$TNmGTv3L9eLENWl9yxUUYeetCUPyP9EyIf9A9fQ35oHH6Dl3nnVJ.', 'Procurement Officer', 'ACTIVE', 0, 0.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (3, '2026-07-08T20:24:30.606825', '2026-07-08T20:24:30.606825', 'requester@digitaldynamics.co.za', '$2a$10$0rHoMfLWZ1/4OgkwPjypzOCq/doyDFZ/oUlWMOvE859qDUZ8sk1Wu', 'Requester User', 'ACTIVE', 0, 0.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (4, '2026-07-08T20:24:30.671871', '2026-07-08T20:24:30.671871', 'approver1@digitaldynamics.co.za', '$2a$10$D95EPUi./SWUgugG52KN6uQQff8HarWmkMCaGAykrDtbA3qIs1AVS', 'Level 1 Approver', 'ACTIVE', 0, 25000.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (5, '2026-07-08T20:24:30.735367', '2026-07-08T20:24:30.735367', 'approver2@digitaldynamics.co.za', '$2a$10$O88JJWzqByyyDFFk3.Ntiu20yPFk7nvO9w7s3XAGkeRnPW0VPJBxi', 'Level 2 Approver', 'ACTIVE', 0, 100000.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (6, '2026-07-08T20:24:30.800449', '2026-07-08T20:24:30.800449', 'approver3@digitaldynamics.co.za', '$2a$10$ZNxsJN5G7ijGhQmFO8JBk.KgA5eQh.ZJXKr11NyojFDHqDdwrH9LO', 'Level 3 Approver', 'ACTIVE', 0, 1000000.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (7, '2026-07-08T20:24:30.865553', '2026-07-08T20:24:30.865553', 'receiving@digitaldynamics.co.za', '$2a$10$tc.kpNRwGcT.R5bnhN5hSOH5ukeFondBDulxccKXpbUA9Ez/tEhOK', 'Receiving Clerk', 'ACTIVE', 0, 0.00);

