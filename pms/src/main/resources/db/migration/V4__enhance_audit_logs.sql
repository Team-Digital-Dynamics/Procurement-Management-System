ALTER TABLE audit_logs ADD COLUMN ip_address VARCHAR(80);
ALTER TABLE audit_logs ADD COLUMN status VARCHAR(40) NOT NULL DEFAULT 'RECORDED';

CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
