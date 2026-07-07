--liquibase formatted sql

--changeset digitaldynamics:add-evaluation-records
--preconditions onFail:MARK_RAN onError:MARK_RAN
--precondition-sql-check expectedResult:2 SELECT COUNT(DISTINCT LOWER(table_name)) FROM information_schema.tables WHERE LOWER(table_name) IN ('rfqs', 'quotations')
--precondition-sql-check expectedResult:0 SELECT COUNT(DISTINCT LOWER(table_name)) FROM information_schema.tables WHERE LOWER(table_name) = 'evaluation_records'
CREATE TABLE IF NOT EXISTS evaluation_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    rfq_id BIGINT NOT NULL,
    quotation_id BIGINT NOT NULL,
    price_score DECIMAL(5,2) NOT NULL,
    delivery_score DECIMAL(5,2) NOT NULL,
    quality_score DECIMAL(5,2) NOT NULL,
    terms_score DECIMAL(5,2) NOT NULL,
    performance_score DECIMAL(5,2) NOT NULL,
    total_weighted_score DECIMAL(8,3) NOT NULL,
    evaluated_by VARCHAR(160) NOT NULL,
    evaluated_at DATETIME(6) NOT NULL,
    notes VARCHAR(500),
    CONSTRAINT fk_eval_records_rfq FOREIGN KEY (rfq_id) REFERENCES rfqs(id),
    CONSTRAINT fk_eval_records_quotation FOREIGN KEY (quotation_id) REFERENCES quotations(id)
);
--rollback DROP TABLE evaluation_records;
