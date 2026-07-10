-- Procurement Management System database backup
-- Source: MANUAL
-- Created at UTC: 2026-07-08T20:34:28.048085500Z

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

INSERT INTO `approval_thresholds` (`id`, `created_at`, `updated_at`, `approval_level`, `approver_role`, `min_amount`, `max_amount`, `description`) VALUES (1, '2026-07-08T22:34:22.022520', '2026-07-08T22:34:22.022520', 1, 'APPROVER_LEVEL_1', 0.00, 25000.00, 'Level 1 approval for low-value requisitions.');
INSERT INTO `approval_thresholds` (`id`, `created_at`, `updated_at`, `approval_level`, `approver_role`, `min_amount`, `max_amount`, `description`) VALUES (2, '2026-07-08T22:34:22.022520', '2026-07-08T22:34:22.022520', 2, 'APPROVER_LEVEL_2', 25000.01, 100000.00, 'Level 2 approval for medium-value requisitions.');
INSERT INTO `approval_thresholds` (`id`, `created_at`, `updated_at`, `approval_level`, `approver_role`, `min_amount`, `max_amount`, `description`) VALUES (3, '2026-07-08T22:34:22.022520', '2026-07-08T22:34:22.022520', 3, 'APPROVER_LEVEL_3', 100000.01, NULL, 'Level 3 approval for high-value requisitions.');












INSERT INTO `user_roles` (`user_id`, `role`) VALUES (1, 'ADMIN');
INSERT INTO `user_roles` (`user_id`, `role`) VALUES (2, 'PROCUREMENT_OFFICER');
INSERT INTO `user_roles` (`user_id`, `role`) VALUES (3, 'REQUESTER');
INSERT INTO `user_roles` (`user_id`, `role`) VALUES (4, 'APPROVER_LEVEL_1');
INSERT INTO `user_roles` (`user_id`, `role`) VALUES (5, 'APPROVER_LEVEL_2');
INSERT INTO `user_roles` (`user_id`, `role`) VALUES (6, 'APPROVER_LEVEL_3');
INSERT INTO `user_roles` (`user_id`, `role`) VALUES (7, 'RECEIVING_CLERK');

INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (1, '2026-07-08T22:34:27.373616', '2026-07-08T22:34:27.373616', 'admin@digitaldynamics.co.za', '$2a$10$Zb19LcrgUYsbNP3oy0dS6u8FRZGYtIW2tuVAdmzga/330YO2HKbqO', 'Backup Verified Admin', 'ACTIVE', 0, 1000000.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (2, '2026-07-08T22:34:27.469988', '2026-07-08T22:34:27.469988', 'procurement@digitaldynamics.co.za', '$2a$10$cKEoMdDB2RJjIiNHDWG31ORYfHSDBkcMZwldvZ/MUvEn8v2NCGyq2', 'Procurement Officer', 'ACTIVE', 0, 0.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (3, '2026-07-08T22:34:27.530631', '2026-07-08T22:34:27.530631', 'requester@digitaldynamics.co.za', '$2a$10$ICXVswd9bdwiNHCLAixPge8Viu2mO0z5oc.hiWDr/kBPJDVOEc4X2', 'Requester User', 'ACTIVE', 0, 0.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (4, '2026-07-08T22:34:27.590632', '2026-07-08T22:34:27.590632', 'approver1@digitaldynamics.co.za', '$2a$10$s4gNi2p8w5sqrKjje5CHvOGtA8KXT/e.CfPV3JKag8ybxjsHIYgHO', 'Level 1 Approver', 'ACTIVE', 0, 25000.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (5, '2026-07-08T22:34:27.651327', '2026-07-08T22:34:27.651327', 'approver2@digitaldynamics.co.za', '$2a$10$Rq1ThDw6klKXVXxZ6qPrTeTk2kDlcPYcbb8jxGSZRHZu/7NPamW5G', 'Level 2 Approver', 'ACTIVE', 0, 100000.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (6, '2026-07-08T22:34:27.712334', '2026-07-08T22:34:27.712334', 'approver3@digitaldynamics.co.za', '$2a$10$N32BPyw5gl9G1C3WbSQUN.ZxPhiI70RPBqJuq9cDGnPUAUhJ.tCvW', 'Level 3 Approver', 'ACTIVE', 0, 1000000.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (7, '2026-07-08T22:34:27.775356', '2026-07-08T22:34:27.775356', 'receiving@digitaldynamics.co.za', '$2a$10$wdUyVjWBY5R2JQNHRGYqSujppwi217a5UGqc8P1FJ0kxFSgAQqfQC', 'Receiving Clerk', 'ACTIVE', 0, 0.00);

