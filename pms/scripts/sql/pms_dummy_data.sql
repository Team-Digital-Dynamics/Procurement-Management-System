-- PMS Scenario Seed Data
-- Run in MySQL Workbench against schema: pms
-- This script is idempotent for the seeded ID ranges.

USE pms;

SET SQL_SAFE_UPDATES = 0;
START TRANSACTION;

-- Cleanup (only seeded ranges)
DELETE FROM evaluation_records WHERE id BETWEEN 9601 AND 9699;
DELETE FROM notifications WHERE notification_id BETWEEN 9501 AND 9599;
DELETE FROM goods_received_notes WHERE id BETWEEN 9451 AND 9499;
DELETE FROM purchase_orders WHERE id BETWEEN 9401 AND 9449;
DELETE FROM quotations WHERE id BETWEEN 9351 AND 9399;
DELETE FROM rfqs WHERE id BETWEEN 9301 AND 9349;
DELETE FROM approvals WHERE id BETWEEN 9251 AND 9299;
DELETE FROM requisition_items WHERE id BETWEEN 9221 AND 9249;
DELETE FROM requisitions WHERE id BETWEEN 9201 AND 9219;
DELETE FROM suppliers WHERE id BETWEEN 9101 AND 9149;
DELETE FROM user_roles WHERE user_id BETWEEN 9001 AND 9049;
DELETE FROM users WHERE id BETWEEN 9001 AND 9049;
DELETE FROM audit_logs WHERE id BETWEEN 9701 AND 9799;

-- Users (password hash below is bcrypt for a known test password in many demos: "password")
INSERT INTO users (id, created_at, updated_at, email, password_hash, full_name, status, failed_login_attempts, approval_limit) VALUES
(9001, NOW(), NOW(), 'admin.test@digitaldynamics.co.za', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5M6Q7YVOlJawVSxGInxjeRGna43EIB', 'Admin Test', 'ACTIVE', 0, 1000000.00),
(9002, NOW(), NOW(), 'procurement.test@digitaldynamics.co.za', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5M6Q7YVOlJawVSxGInxjeRGna43EIB', 'Procurement Officer Test', 'ACTIVE', 0, 500000.00),
(9003, NOW(), NOW(), 'requester.test@digitaldynamics.co.za', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5M6Q7YVOlJawVSxGInxjeRGna43EIB', 'Requester Test', 'ACTIVE', 0, 10000.00),
(9004, NOW(), NOW(), 'approver1.test@digitaldynamics.co.za', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5M6Q7YVOlJawVSxGInxjeRGna43EIB', 'Approver Level 1 Test', 'ACTIVE', 0, 25000.00),
(9005, NOW(), NOW(), 'approver2.test@digitaldynamics.co.za', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5M6Q7YVOlJawVSxGInxjeRGna43EIB', 'Approver Level 2 Test', 'ACTIVE', 0, 150000.00),
(9006, NOW(), NOW(), 'receiving.test@digitaldynamics.co.za', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5M6Q7YVOlJawVSxGInxjeRGna43EIB', 'Receiving Clerk Test', 'ACTIVE', 0, 10000.00),
(9007, NOW(), NOW(), 'supplier.user1@digitaldynamics.co.za', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5M6Q7YVOlJawVSxGInxjeRGna43EIB', 'Supplier User 1', 'ACTIVE', 0, 0.00),
(9008, NOW(), NOW(), 'supplier.user2@digitaldynamics.co.za', '$2a$10$7EqJtq98hPqEX7fNZaFWoO5M6Q7YVOlJawVSxGInxjeRGna43EIB', 'Supplier User 2', 'ACTIVE', 0, 0.00);

INSERT INTO user_roles (user_id, role) VALUES
(9001, 'ADMIN'),
(9002, 'PROCUREMENT_OFFICER'),
(9003, 'REQUESTER'),
(9004, 'APPROVER_LEVEL_1'),
(9005, 'APPROVER_LEVEL_2'),
(9006, 'RECEIVING_CLERK'),
(9007, 'SUPPLIER'),
(9008, 'SUPPLIER');

-- Suppliers
INSERT INTO suppliers (id, created_at, updated_at, name, contact_email, phone, tax_number, status, performance_score) VALUES
(9101, NOW(), NOW(), 'Cape Office Supplies', 'quotes@capeoffice.test', '+27-21-000-1001', 'TAX-CAPE-001', 'APPROVED', 86.50),
(9102, NOW(), NOW(), 'Metro Industrial Partners', 'sales@metroindustrial.test', '+27-11-000-1002', 'TAX-METRO-002', 'APPROVED', 78.20),
(9103, NOW(), NOW(), 'Harbor Tech Vendors', 'biddesk@harbortech.test', '+27-31-000-1003', 'TAX-HARBOR-003', 'PENDING', 65.00),
(9104, NOW(), NOW(), 'Legacy Stationery Co', 'contact@legacystationery.test', '+27-12-000-1004', 'TAX-LEGACY-004', 'SUSPENDED', 59.40);

-- Requisitions (covering multiple statuses)
INSERT INTO requisitions (id, created_at, updated_at, title, business_justification, requester_id, status, total_amount) VALUES
(9201, NOW(), NOW(), 'Laptop Refresh - Draft', 'Replace aging laptops for procurement and approvals teams.', 9003, 'DRAFT', 52000.00),
(9202, NOW(), NOW(), 'Printer Cartridges Q3', 'Quarterly cartridge replenishment for head office.', 9003, 'SUBMITTED', 7800.00),
(9203, NOW(), NOW(), 'Warehouse Barcode Scanners', 'Improve receiving speed and stock accuracy.', 9003, 'APPROVED', 24500.00),
(9204, NOW(), NOW(), 'Office Ergonomic Chairs', 'Reduce workplace injury and improve compliance.', 9003, 'RFQ_CREATED', 36000.00),
(9205, NOW(), NOW(), 'Non-Approved Travel Request', 'Travel expansion not aligned with current budget controls.', 9003, 'REJECTED', 18400.00);

INSERT INTO requisition_items (id, created_at, updated_at, requisition_id, description, quantity, estimated_unit_price) VALUES
(9221, NOW(), NOW(), 9201, 'Business Laptop 16GB/512GB', 4.00, 13000.00),
(9222, NOW(), NOW(), 9202, 'Laser Printer Cartridge Set', 12.00, 650.00),
(9223, NOW(), NOW(), 9203, 'Barcode Scanner Rugged', 7.00, 3500.00),
(9224, NOW(), NOW(), 9204, 'Ergonomic Mesh Chair', 18.00, 2000.00),
(9225, NOW(), NOW(), 9205, 'Travel Package Placeholder', 1.00, 18400.00);

-- Approvals
INSERT INTO approvals (id, created_at, updated_at, requisition_id, approver_id, approval_level, decision, comments, decided_at) VALUES
(9251, NOW(), NOW(), 9202, 9004, 1, 'PENDING', 'Awaiting review.', NULL),
(9252, NOW(), NOW(), 9203, 9004, 1, 'APPROVED', 'Operationally required.', NOW()),
(9253, NOW(), NOW(), 9204, 9005, 2, 'APPROVED', 'Budget validated for Q3.', NOW()),
(9254, NOW(), NOW(), 9205, 9004, 1, 'REJECTED', 'Budget not allocated.', NOW());

-- RFQs
INSERT INTO rfqs (id, created_at, updated_at, requisition_id, rfq_number, submission_deadline, status, price_weight, delivery_weight, quality_weight, terms_weight, performance_weight) VALUES
(9301, NOW(), NOW(), 9204, 'RFQ-TEST-9301', DATE_ADD(NOW(), INTERVAL 10 DAY), 'OPEN', 50, 20, 15, 10, 5),
(9302, NOW(), NOW(), 9203, 'RFQ-TEST-9302', DATE_SUB(NOW(), INTERVAL 5 DAY), 'CLOSED', 45, 20, 20, 10, 5);

-- Quotations
INSERT INTO quotations (id, created_at, updated_at, rfq_id, supplier_id, total_amount, delivery_days, quality_score, terms_score, evaluation_score, submitted_at, winning) VALUES
(9351, NOW(), NOW(), 9301, 9101, 33800.00, 9, 88, 85, 90.250, NOW(), TRUE),
(9352, NOW(), NOW(), 9301, 9102, 34450.00, 7, 82, 80, 86.750, NOW(), FALSE),
(9353, NOW(), NOW(), 9302, 9101, 23800.00, 8, 84, 82, 88.100, DATE_SUB(NOW(), INTERVAL 6 DAY), TRUE),
(9354, NOW(), NOW(), 9302, 9102, 24200.00, 10, 86, 79, 85.400, DATE_SUB(NOW(), INTERVAL 6 DAY), FALSE);

-- Evaluation records
INSERT INTO evaluation_records (id, created_at, updated_at, rfq_id, quotation_id, price_score, delivery_score, quality_score, terms_score, performance_score, total_weighted_score, evaluated_by, evaluated_at, notes) VALUES
(9601, NOW(), NOW(), 9301, 9351, 96.20, 88.00, 88.00, 85.00, 90.00, 90.250, 'procurement.test@digitaldynamics.co.za', NOW(), 'Best weighted outcome.'),
(9602, NOW(), NOW(), 9301, 9352, 94.00, 92.00, 82.00, 80.00, 78.00, 86.750, 'procurement.test@digitaldynamics.co.za', NOW(), 'Good speed, slightly higher price.'),
(9603, NOW(), NOW(), 9302, 9353, 95.00, 87.00, 84.00, 82.00, 86.00, 88.100, 'procurement.test@digitaldynamics.co.za', DATE_SUB(NOW(), INTERVAL 5 DAY), 'Closed RFQ winner.'),
(9604, NOW(), NOW(), 9302, 9354, 93.00, 82.00, 86.00, 79.00, 80.00, 85.400, 'procurement.test@digitaldynamics.co.za', DATE_SUB(NOW(), INTERVAL 5 DAY), 'Backup quotation.');

-- Purchase orders
INSERT INTO purchase_orders (id, created_at, updated_at, po_number, quotation_id, supplier_id, total_amount, status) VALUES
(9401, NOW(), NOW(), 'PO-TEST-9401', 9351, 9101, 33800.00, 'SENT'),
(9402, DATE_SUB(NOW(), INTERVAL 4 DAY), NOW(), 'PO-TEST-9402', 9353, 9101, 23800.00, 'RECEIVED');

-- Goods received notes
INSERT INTO goods_received_notes (id, created_at, updated_at, purchase_order_id, received_by, received_value, discrepancy, notes) VALUES
(9451, NOW(), NOW(), 9401, 'Receiving Clerk Test', 17000.00, TRUE, 'Partial delivery received; balance due next shipment.'),
(9452, DATE_SUB(NOW(), INTERVAL 3 DAY), NOW(), 9402, 'Receiving Clerk Test', 23800.00, FALSE, 'Received in full and accepted.');

-- Notifications
INSERT INTO notifications (notification_id, recipient_id, type, message, read_status, created_ts) VALUES
(9501, 9002, 'RFQ_CREATED', 'RFQ-TEST-9301 has been created and is open for quotations.', FALSE, NOW()),
(9502, 9007, 'RFQ_INVITE', 'You have been invited to submit a quotation for RFQ-TEST-9301.', FALSE, NOW()),
(9503, 9008, 'RFQ_INVITE', 'You have been invited to submit a quotation for RFQ-TEST-9301.', FALSE, NOW()),
(9504, 9006, 'GRN_ALERT', 'PO-TEST-9401 has a partial delivery discrepancy.', FALSE, NOW()),
(9505, 9003, 'APPROVAL_DECISION', 'Requisition 9205 was rejected by approver level 1.', TRUE, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- Audit logs
INSERT INTO audit_logs (id, created_at, actor, action, entity_type, entity_id, details) VALUES
(9701, NOW(), 'procurement.test@digitaldynamics.co.za', 'CREATE_RFQ', 'Rfq', '9301', 'RFQ created from requisition 9204.'),
(9702, NOW(), 'supplier.user1@digitaldynamics.co.za', 'SUBMIT_QUOTATION', 'Quotation', '9351', 'Quotation submitted for RFQ-TEST-9301.'),
(9703, NOW(), 'supplier.user2@digitaldynamics.co.za', 'SUBMIT_QUOTATION', 'Quotation', '9352', 'Quotation submitted for RFQ-TEST-9301.'),
(9704, NOW(), 'procurement.test@digitaldynamics.co.za', 'EVALUATE_RFQ', 'Rfq', '9301', 'Evaluation completed with weighted scoring.'),
(9705, NOW(), 'procurement.test@digitaldynamics.co.za', 'AWARD_RFQ', 'PurchaseOrder', '9401', 'Awarded winning supplier and generated purchase order.'),
(9706, NOW(), 'receiving.test@digitaldynamics.co.za', 'CAPTURE_GRN', 'GoodsReceivedNote', '9451', 'Partial receipt captured with discrepancy flag.');

COMMIT;

-- Quick sanity checks
SELECT 'users' AS table_name, COUNT(*) AS cnt FROM users WHERE id BETWEEN 9001 AND 9049
UNION ALL SELECT 'suppliers', COUNT(*) FROM suppliers WHERE id BETWEEN 9101 AND 9149
UNION ALL SELECT 'requisitions', COUNT(*) FROM requisitions WHERE id BETWEEN 9201 AND 9219
UNION ALL SELECT 'rfqs', COUNT(*) FROM rfqs WHERE id BETWEEN 9301 AND 9349
UNION ALL SELECT 'quotations', COUNT(*) FROM quotations WHERE id BETWEEN 9351 AND 9399
UNION ALL SELECT 'purchase_orders', COUNT(*) FROM purchase_orders WHERE id BETWEEN 9401 AND 9449
UNION ALL SELECT 'goods_received_notes', COUNT(*) FROM goods_received_notes WHERE id BETWEEN 9451 AND 9499
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications WHERE notification_id BETWEEN 9501 AND 9599
UNION ALL SELECT 'evaluation_records', COUNT(*) FROM evaluation_records WHERE id BETWEEN 9601 AND 9699;
