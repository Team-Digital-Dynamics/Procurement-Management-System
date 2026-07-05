


CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    status VARCHAR(20) NOT NULL,
    failed_login_attempts INT NOT NULL,
    approval_limit DECIMAL(14,2) NOT NULL
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role VARCHAR(40) NOT NULL,
    PRIMARY KEY (user_id, role),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE suppliers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    name VARCHAR(160) NOT NULL,
    contact_email VARCHAR(160) NOT NULL UNIQUE,
    phone VARCHAR(40),
    tax_number VARCHAR(80),
    status VARCHAR(20) NOT NULL,
    performance_score DECIMAL(5,2) NOT NULL
);

CREATE TABLE requisitions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    title VARCHAR(160) NOT NULL,
    business_justification VARCHAR(2000) NOT NULL,
    requester_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL,
    total_amount DECIMAL(14,2) NOT NULL,
    CONSTRAINT fk_requisitions_requester FOREIGN KEY (requester_id) REFERENCES users(id)
);

CREATE TABLE requisition_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    requisition_id BIGINT NOT NULL,
    description VARCHAR(240) NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,
    estimated_unit_price DECIMAL(14,2) NOT NULL,
    CONSTRAINT fk_requisition_items_req FOREIGN KEY (requisition_id) REFERENCES requisitions(id)
);

CREATE TABLE approvals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    requisition_id BIGINT NOT NULL,
    approver_id BIGINT NOT NULL,
    approval_level INT NOT NULL,
    decision VARCHAR(20) NOT NULL,
    comments VARCHAR(1000),
    decided_at DATETIME(6),
    CONSTRAINT fk_approvals_req FOREIGN KEY (requisition_id) REFERENCES requisitions(id),
    CONSTRAINT fk_approvals_approver FOREIGN KEY (approver_id) REFERENCES users(id)
);

CREATE TABLE rfqs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    requisition_id BIGINT NOT NULL,
    rfq_number VARCHAR(40) NOT NULL UNIQUE,
    submission_deadline DATETIME(6) NOT NULL,
    status VARCHAR(20) NOT NULL,
    price_weight INT NOT NULL,
    delivery_weight INT NOT NULL,
    quality_weight INT NOT NULL,
    terms_weight INT NOT NULL,
    performance_weight INT NOT NULL,
    CONSTRAINT fk_rfqs_req FOREIGN KEY (requisition_id) REFERENCES requisitions(id)
);

CREATE TABLE quotations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    rfq_id BIGINT NOT NULL,
    supplier_id BIGINT NOT NULL,
    total_amount DECIMAL(14,2) NOT NULL,
    delivery_days INT NOT NULL,
    quality_score INT NOT NULL,
    terms_score INT NOT NULL,
    evaluation_score DECIMAL(8,3) NOT NULL,
    submitted_at DATETIME(6) NOT NULL,
    winning BOOLEAN NOT NULL,
    CONSTRAINT fk_quotations_rfq FOREIGN KEY (rfq_id) REFERENCES rfqs(id),
    CONSTRAINT fk_quotations_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    CONSTRAINT uq_quotations_rfq_supplier UNIQUE (rfq_id, supplier_id)
);

CREATE TABLE purchase_orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    po_number VARCHAR(40) NOT NULL UNIQUE,
    quotation_id BIGINT NOT NULL,
    supplier_id BIGINT NOT NULL,
    total_amount DECIMAL(14,2) NOT NULL,
    status VARCHAR(30) NOT NULL,
    CONSTRAINT fk_purchase_orders_quote FOREIGN KEY (quotation_id) REFERENCES quotations(id),
    CONSTRAINT fk_purchase_orders_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE goods_received_notes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    purchase_order_id BIGINT NOT NULL,
    received_by VARCHAR(80) NOT NULL,
    received_value DECIMAL(14,2) NOT NULL,
    discrepancy BOOLEAN NOT NULL,
    notes VARCHAR(1000),
    CONSTRAINT fk_grns_po FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id)
);

CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    created_at DATETIME(6) NOT NULL,
    actor VARCHAR(160) NOT NULL,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id VARCHAR(80),
    details VARCHAR(2000) NOT NULL
);
