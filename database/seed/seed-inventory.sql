BEGIN;

-- ============ PURCHASE ORDERS (Warung A) ============
INSERT INTO purchase_orders (id, po_code, supplier_id, order_date, status, notes, subtotal, tax_amount, total_amount) VALUES
  (1, 'PO-20260520-001', 1, DATE '2026-05-20', 'received', 'Restock beras mingguan', 750000, 0, 750000),
  (2, 'PO-20260520-002', 2, DATE '2026-05-20', 'received', 'Restock ayam fillet', 550000, 0, 550000),
  (3, 'PO-20260518-001', 3, DATE '2026-05-18', 'received', 'Restock minyak goreng', 420000, 0, 420000),
  (4, 'PO-20260518-002', 4, DATE '2026-05-18', 'received', 'Restock sayur & bumbu', 380000, 0, 380000),
  (5, 'PO-20260515-001', 1, DATE '2026-05-15', 'received', 'Restock beras', 600000, 0, 600000),
  (6, 'PO-20260515-002', 2, DATE '2026-05-15', 'received', 'Restock protein', 480000, 0, 480000);

-- ============ PURCHASE ORDERS (Warung B) ============
INSERT INTO purchase_orders (id, po_code, supplier_id, order_date, status, notes, subtotal, tax_amount, total_amount) VALUES
  (7, 'PO-20260521-001', 5, DATE '2026-05-21', 'received', 'Restock beras', 640000, 0, 640000),
  (8, 'PO-20260521-002', 6, DATE '2026-05-21', 'received', 'Restock ayam', 464000, 0, 464000),
  (9, 'PO-20260519-001', 7, DATE '2026-05-19', 'received', 'Restock bumbu & sayur', 350000, 0, 350000),
  (10, 'PO-20260516-001', 5, DATE '2026-05-16', 'received', 'Restock beras', 480000, 0, 480000);
SELECT setval('purchase_orders_id_seq', 10);

-- ============ PURCHASE ORDER ITEMS (Warung A) ============
INSERT INTO purchase_order_items (purchase_order_id, ingredient_id, qty, unit, price_per_unit, line_total) VALUES
  (1, 1, 50000, 'gram', 15, 750000),
  (2, 2, 10000, 'gram', 55, 550000),
  (3, 3, 15000, 'ml', 28, 420000),
  (4, 6, 5000, 'gram', 40, 200000),
  (4, 7, 2000, 'gram', 45, 90000),
  (4, 8, 1500, 'gram', 60, 90000),
  (5, 1, 40000, 'gram', 15, 600000),
  (6, 2, 5000, 'gram', 55, 275000),
  (6, 18, 2000, 'gram', 90, 180000),
  (6, 4, 10, 'pcs', 2500, 25000);

-- ============ PURCHASE ORDER ITEMS (Warung B) ============
INSERT INTO purchase_order_items (purchase_order_id, ingredient_id, qty, unit, price_per_unit, line_total) VALUES
  (7, 25, 40000, 'gram', 16, 640000),
  (8, 26, 8000, 'gram', 58, 464000),
  (9, 30, 4000, 'gram', 42, 168000),
  (9, 31, 2000, 'gram', 48, 96000),
  (9, 32, 1000, 'gram', 65, 65000),
  (9, 44, 1200, 'gram', 18, 21600),
  (10, 25, 30000, 'gram', 16, 480000);

-- ============ STOCK MOVEMENTS (Warung A) ============
INSERT INTO stock_movements (movement_code, movement_date, ingredient_id, movement_type, qty, unit, reference_type, reference_code, notes, created_by, tenant_id) VALUES
  -- Incoming from PO
  ('MV-A-20260520-001', DATE '2026-05-20', 1, 'in', 50000, 'gram', 'purchase_order', 'PO-20260520-001', 'Barang masuk dari PO', 'Manager Warung A', 1),
  ('MV-A-20260520-002', DATE '2026-05-20', 2, 'in', 10000, 'gram', 'purchase_order', 'PO-20260520-002', 'Barang masuk dari PO', 'Manager Warung A', 1),
  ('MV-A-20260518-001', DATE '2026-05-18', 3, 'in', 15000, 'ml', 'purchase_order', 'PO-20260518-001', 'Barang masuk dari PO', 'Manager Warung A', 1),
  ('MV-A-20260518-002', DATE '2026-05-18', 6, 'in', 5000, 'gram', 'purchase_order', 'PO-20260518-002', 'Barang masuk dari PO', 'Manager Warung A', 1),
  ('MV-A-20260518-003', DATE '2026-05-18', 7, 'in', 2000, 'gram', 'purchase_order', 'PO-20260518-002', 'Barang masuk dari PO', 'Manager Warung A', 1),
  ('MV-A-20260515-001', DATE '2026-05-15', 1, 'in', 40000, 'gram', 'purchase_order', 'PO-20260515-001', 'Barang masuk dari PO', 'Manager Warung A', 1),
  ('MV-A-20260515-002', DATE '2026-05-15', 2, 'in', 5000, 'gram', 'purchase_order', 'PO-20260515-002', 'Barang masuk dari PO', 'Manager Warung A', 1),
  -- Outgoing from sales
  ('MV-A-20260521-001', DATE '2026-05-21', 1, 'out', 3000, 'gram', 'sales_order', 'DAILY', 'Pemakaian harian', 'Kasir A1', 1),
  ('MV-A-20260521-002', DATE '2026-05-21', 2, 'out', 2000, 'gram', 'sales_order', 'DAILY', 'Pemakaian harian', 'Kasir A1', 1),
  ('MV-A-20260521-003', DATE '2026-05-21', 3, 'out', 500, 'ml', 'sales_order', 'DAILY', 'Pemakaian harian', 'Kasir A1', 1),
  ('MV-A-20260521-004', DATE '2026-05-21', 4, 'out', 15, 'pcs', 'sales_order', 'DAILY', 'Pemakaian harian', 'Kasir A1', 1),
  ('MV-A-20260520-003', DATE '2026-05-20', 1, 'out', 4500, 'gram', 'sales_order', 'DAILY', 'Pemakaian harian', 'Kasir A2', 1),
  ('MV-A-20260520-004', DATE '2026-05-20', 2, 'out', 3000, 'gram', 'sales_order', 'DAILY', 'Pemakaian harian', 'Kasir A2', 1),
  -- Adjustment
  ('MV-A-20260519-001', DATE '2026-05-19', 8, 'adjustment', 200, 'gram', 'stock_opname', 'SO-A-001', 'Koreksi stok opname cabai', 'Manager Warung A', 1);

-- ============ STOCK MOVEMENTS (Warung B) ============
INSERT INTO stock_movements (movement_code, movement_date, ingredient_id, movement_type, qty, unit, reference_type, reference_code, notes, created_by, tenant_id) VALUES
  -- Incoming from PO
  ('MV-B-20260521-001', DATE '2026-05-21', 25, 'in', 40000, 'gram', 'purchase_order', 'PO-20260521-001', 'Barang masuk dari PO', 'Manager Warung B', 2),
  ('MV-B-20260521-002', DATE '2026-05-21', 26, 'in', 8000, 'gram', 'purchase_order', 'PO-20260521-002', 'Barang masuk dari PO', 'Manager Warung B', 2),
  ('MV-B-20260519-001', DATE '2026-05-19', 30, 'in', 4000, 'gram', 'purchase_order', 'PO-20260519-001', 'Barang masuk dari PO', 'Manager Warung B', 2),
  ('MV-B-20260519-002', DATE '2026-05-19', 31, 'in', 2000, 'gram', 'purchase_order', 'PO-20260519-001', 'Barang masuk dari PO', 'Manager Warung B', 2),
  ('MV-B-20260516-001', DATE '2026-05-16', 25, 'in', 30000, 'gram', 'purchase_order', 'PO-20260516-001', 'Barang masuk dari PO', 'Manager Warung B', 2),
  -- Outgoing from sales
  ('MV-B-20260522-001', DATE '2026-05-22', 25, 'out', 3600, 'gram', 'sales_order', 'DAILY', 'Pemakaian harian', 'Kasir B1', 2),
  ('MV-B-20260522-002', DATE '2026-05-22', 26, 'out', 2500, 'gram', 'sales_order', 'DAILY', 'Pemakaian harian', 'Kasir B1', 2),
  ('MV-B-20260522-003', DATE '2026-05-22', 27, 'out', 400, 'ml', 'sales_order', 'DAILY', 'Pemakaian harian', 'Kasir B1', 2),
  ('MV-B-20260521-003', DATE '2026-05-21', 25, 'out', 2700, 'gram', 'sales_order', 'DAILY', 'Pemakaian harian', 'Kasir B2', 2),
  ('MV-B-20260521-004', DATE '2026-05-21', 26, 'out', 1800, 'gram', 'sales_order', 'DAILY', 'Pemakaian harian', 'Kasir B2', 2),
  -- Adjustment
  ('MV-B-20260520-001', DATE '2026-05-20', 32, 'adjustment', 150, 'gram', 'stock_opname', 'SO-B-001', 'Koreksi stok cabai busuk', 'Manager Warung B', 2);

COMMIT;
