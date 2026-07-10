UPDATE suppliers
SET status = 'PENDING'
WHERE status = 'PENDING_REVIEW';

UPDATE suppliers
SET status = 'SUSPENDED'
WHERE status = 'INACTIVE';
