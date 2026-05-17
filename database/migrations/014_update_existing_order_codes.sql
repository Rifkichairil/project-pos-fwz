BEGIN;

-- Update existing order codes from TRX-{timestamp} format to TRX-YYYYMMDD-NNNN format
WITH numbered AS (
  SELECT
    id,
    order_code,
    order_at::date AS order_date,
    ROW_NUMBER() OVER (PARTITION BY order_at::date ORDER BY order_at, id) AS seq
  FROM sales_orders
  WHERE order_code LIKE 'TRX-%' AND order_code NOT LIKE 'TRX-________-____'
)
UPDATE sales_orders so
SET order_code = 'TRX-' || TO_CHAR(n.order_date, 'YYYYMMDD') || '-' || LPAD(n.seq::text, 4, '0'),
    updated_at = NOW()
FROM numbered n
WHERE so.id = n.id;

-- Also update references in member_transactions
WITH numbered AS (
  SELECT
    so.id,
    so.order_code AS old_code,
    'TRX-' || TO_CHAR(so.order_at::date, 'YYYYMMDD') || '-' || LPAD(
      ROW_NUMBER() OVER (PARTITION BY so.order_at::date ORDER BY so.order_at, so.id)::text, 4, '0'
    ) AS new_code
  FROM sales_orders so
  WHERE so.order_code LIKE 'TRX-________-____'
)
UPDATE member_transactions mt
SET transaction_code = n.new_code
FROM numbered n
JOIN sales_orders so ON so.id = n.id
WHERE mt.transaction_code = n.old_code
  AND mt.transaction_code != n.new_code;

-- Update daily_order_sequence with today's count
INSERT INTO daily_order_sequence (order_date, last_seq)
SELECT order_at::date, COUNT(*)
FROM sales_orders
WHERE order_at::date = CURRENT_DATE
GROUP BY order_at::date
ON CONFLICT (order_date) DO UPDATE SET last_seq = EXCLUDED.last_seq;

COMMIT;
