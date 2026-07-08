-- Procurement Management System database backup
-- Source: SCHEDULED
-- Created at UTC: 2026-07-08T09:14:17.014793200Z

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

INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (1, '2026-07-08T11:14:16.246579', '2026-07-08T11:14:16.246579', 'admin@digitaldynamics.co.za', '$2a$10$s7CFQ6HkwVUVpFSIS.aQCel4Qu2t5Uqcah2U.K9NhoNUtnAaf72Ci', 'Backup Verified Admin', 'ACTIVE', 0, 1000000.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (2, '2026-07-08T11:14:16.350432', '2026-07-08T11:14:16.350432', 'procurement@digitaldynamics.co.za', '$2a$10$gBs6DqmCpQ47kyj/TU7aluvMhZrxbf6b9Ep/8c5XNkFyuBKtm7LTe', 'Procurement Officer', 'ACTIVE', 0, 0.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (3, '2026-07-08T11:14:16.415876', '2026-07-08T11:14:16.415876', 'requester@digitaldynamics.co.za', '$2a$10$F5BMnfTqDEBdeKmLcQmtDe1oGInX3wycmyg4BRdzJfcD0/XbbPfhi', 'Requester User', 'ACTIVE', 0, 0.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (4, '2026-07-08T11:14:16.480880', '2026-07-08T11:14:16.480880', 'approver1@digitaldynamics.co.za', '$2a$10$c1yia8rgbHluLvRLd3zMWeYNeXyifipC/FxyqSF8N74skKz07upBm', 'Level 1 Approver', 'ACTIVE', 0, 25000.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (5, '2026-07-08T11:14:16.543395', '2026-07-08T11:14:16.543395', 'approver2@digitaldynamics.co.za', '$2a$10$vEBGkQvOj1NhiHQgrxij5eIJpKjsJwa/w/Z.ySaCq5Rf2GOlCV8/i', 'Level 2 Approver', 'ACTIVE', 0, 100000.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (6, '2026-07-08T11:14:16.602198', '2026-07-08T11:14:16.602198', 'approver3@digitaldynamics.co.za', '$2a$10$kzaWemkGEfhM9EH1B6kWH.OgWZxZcPufAkfxDCT5UFoB1XhnwEUQy', 'Level 3 Approver', 'ACTIVE', 0, 1000000.00);
INSERT INTO `users` (`id`, `created_at`, `updated_at`, `email`, `password_hash`, `full_name`, `status`, `failed_login_attempts`, `approval_limit`) VALUES (7, '2026-07-08T11:14:16.662716', '2026-07-08T11:14:16.662716', 'receiving@digitaldynamics.co.za', '$2a$10$Lplf3TqNzRkdj8JbcnYWAeuclMPybdDFYTRYIcSpP9heNlS/baGX.', 'Receiving Clerk', 'ACTIVE', 0, 0.00);

