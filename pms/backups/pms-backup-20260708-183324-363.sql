-- Procurement Management System database backup
-- Source: SCHEDULED
-- Created at UTC: 2026-07-08T18:33:24.363135400Z

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

INSERT INTO `approval_thresholds` (`id`, `created_at`, `updated_at`, `approval_level`, `approver_role`, `min_amount`, `max_amount`, `description`) VALUES (1, '2026-07-08T20:33:18.345151', '2026-07-08T20:33:18.345151', 1, 'APPROVER_LEVEL_1', 0.00, 25000.00, 'Level 1 approval for low-value requisitions.');
INSERT INTO `approval_thresholds` (`id`, `created_at`, `updated_at`, `approval_level`, `approver_role`, `min_amount`, `max_amount`, `description`) VALUES (2, '2026-07-08T20:33:18.345151', '2026-07-08T20:33:18.345151', 2, 'APPROVER_LEVEL_2', 25000.01, 100000.00, 'Level 2 approval for medium-value requisitions.');
INSERT INTO `approval_thresholds` (`id`, `created_at`, `updated_at`, `approval_level`, `approver_role`, `min_amount`, `max_amount`, `description`) VALUES (3, '2026-07-08T20:33:18.345151', '2026-07-08T20:33:18.345151', 3, 'APPROVER_LEVEL_3', 100000.01, NULL, 'Level 3 approval for high-value requisitions.');












INSERT INTO `user_roles` (`user_id`, `role`) VALUES (1, 'ADMIN');
INSERT INTO `user_roles` (`user_id`, `role`) VALUES (2, 'PROCUREMENT_OFFICER');
INSERT INTO `user_roles` (`user_id`, `role`) VALUES (3, 'REQUESTER');
INSERT INTO `user_roles` (`user_id`, `role`) VALUES (4, 'APPROVER_LEVEL_1');
INSERT INTO `user_roles` (`user_id`, `role`) VALUES (5, 'APPROVER_LEVEL_2');
INSERT INTO `user_roles` (`user_id`, `role`) VALUES (6, 'APPROVER_LEVEL_3');
INSERT INTO `user_roles` (`user_id`, `role`) VALUES (7, 'RECEIVING_CLERK');

INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (1, '2026-07-08T20:33:23.633030', '2026-07-08T20:33:23.633030', 'admin@digitaldynamics.co.za', '$2a$10$dL.z04ilGiV4Z0GSDSMVquXSYeDb07sz6pjRbsk/DoF1faPW6r.xa', 'Backup Verified Admin', 'ACTIVE', 0, 1000000.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (2, '2026-07-08T20:33:23.737552', '2026-07-08T20:33:23.737552', 'procurement@digitaldynamics.co.za', '$2a$10$x.Tpeq6K7bOfquKKWynu1.AqGkth43T/fgh9GVQqTPZiP.B24lK.K', 'Procurement Officer', 'ACTIVE', 0, 0.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (3, '2026-07-08T20:33:23.801483', '2026-07-08T20:33:23.801483', 'requester@digitaldynamics.co.za', '$2a$10$H7dziD/96fLdv0QzfLXR3O/kCQaDX4EOcfA7JvdplD9mbfNZAEvY2', 'Requester User', 'ACTIVE', 0, 0.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (4, '2026-07-08T20:33:23.863787', '2026-07-08T20:33:23.863787', 'approver1@digitaldynamics.co.za', '$2a$10$g031XX1/671ZhuerWPXj4.33KZ9hsiA/5d9Z8G5nrwBcDP7P2glCe', 'Level 1 Approver', 'ACTIVE', 0, 25000.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (5, '2026-07-08T20:33:23.928927', '2026-07-08T20:33:23.928927', 'approver2@digitaldynamics.co.za', '$2a$10$tPIUDzksPKlKvxASMHx9u.7fH30h.GG3brfs1ZhnxevvreJsJWEMm', 'Level 2 Approver', 'ACTIVE', 0, 100000.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (6, '2026-07-08T20:33:23.994148', '2026-07-08T20:33:23.994148', 'approver3@digitaldynamics.co.za', '$2a$10$nGPYQEkL2troHS1vzagW2eUQ4FzKNLdIGuIkj1.XSP2Bt6XLCfk/G', 'Level 3 Approver', 'ACTIVE', 0, 1000000.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (7, '2026-07-08T20:33:24.055768', '2026-07-08T20:33:24.055768', 'receiving@digitaldynamics.co.za', '$2a$10$IEW0PqgM4G8TGr9DUv0rcejqZd2wEGtKsBQ6yiZT44LrUye9L/XK2', 'Receiving Clerk', 'ACTIVE', 0, 0.00);

