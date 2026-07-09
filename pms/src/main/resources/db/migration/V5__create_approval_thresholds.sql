CREATE TABLE approval_thresholds (
    id BIGINT NOT NULL AUTO_INCREMENT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    approval_level INT NOT NULL,
    approver_role VARCHAR(40) NOT NULL,
    min_amount DECIMAL(14, 2) NOT NULL,
    max_amount DECIMAL(14, 2) NULL,
    description VARCHAR(255) NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uk_approval_thresholds_level (approval_level)
);

INSERT INTO approval_thresholds (
    approval_level,
    approver_role,
    min_amount,
    max_amount,
    description
) VALUES
(
    1,
    'APPROVER_LEVEL_1',
    0.00,
    25000.00,
    'Level 1 approval for low-value requisitions.'
),
(
    2,
    'APPROVER_LEVEL_2',
    25000.01,
    100000.00,
    'Level 2 approval for medium-value requisitions.'
),
(
    3,
    'APPROVER_LEVEL_3',
    100000.01,
    NULL,
    'Level 3 approval for high-value requisitions.'
);