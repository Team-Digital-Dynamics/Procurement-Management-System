UPDATE purchase_orders
SET status = 'ISSUED'
WHERE status = 'PENDING';
