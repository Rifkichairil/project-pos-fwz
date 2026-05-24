BEGIN;

-- ============ TENANT ============
INSERT INTO tenants (id, slug, name, status) VALUES
  (3, 'warung-a2', 'Warung A-2', 'active');
SELECT setval('tenants_id_seq', 3);

-- ============ SETTINGS ============
INSERT INTO settings (tenant_id, store_name, address, wifi_password, pb1_enabled, pb1_rate, service_enabled, service_rate, ppn_enabled, ppn_rate, qris_image_url, inventory_policy, point_value, point_per_rupiah)
VALUES (3, 'Warung A-2', 'Jl. Gatot Subroto No. 5, Jakarta', 'warungA2pass', TRUE, 10, TRUE, 5, FALSE, 11, '', 'medium', 1, 10000);

-- ============ USERS ============
INSERT INTO users (id, fullname, username, email, password, role, active_tenant_id, is_active) VALUES
  (8, 'Kasir A2-1', 'kasir_a2_1', 'kasir1@warunga2.com', '$2a$10$placeholder', 'cashier', 3, TRUE),
  (9, 'Kasir A2-2', 'kasir_a2_2', 'kasir2@warunga2.com', '$2a$10$placeholder', 'cashier', 3, TRUE);
SELECT setval('users_id_seq', 9);

INSERT INTO user_tenants (user_id, tenant_id, role, is_default) VALUES
  (8, 3, 'cashier', TRUE),
  (9, 3, 'cashier', TRUE);

-- Assign manager_a to Warung A-2 as well (so they can switch)
INSERT INTO user_tenants (user_id, tenant_id, role, is_default) VALUES
  (2, 3, 'manager', FALSE)
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- ============ INGREDIENTS ============
INSERT INTO ingredients (id, name, base_unit, price_per_unit, supplier, stock, tenant_id) VALUES
  (49, 'Beras', 'gram', 15, 'PT Beras Jaya', 40000, 3),
  (50, 'Ayam Fillet', 'gram', 56, 'PT Sumber Protein', 8000, 3),
  (51, 'Minyak Goreng', 'ml', 28, 'Bimoli', 12000, 3),
  (52, 'Telur', 'pcs', 2500, 'Peternakan Sejahtera', 400, 3),
  (53, 'Kecap Manis', 'ml', 35, 'ABC', 4000, 3),
  (54, 'Bawang Merah', 'gram', 42, 'Sayurku', 4000, 3),
  (55, 'Bawang Putih', 'gram', 46, 'Sayurku', 3500, 3),
  (56, 'Gula Pasir', 'gram', 18, 'Gulaku', 8000, 3),
  (57, 'Garam', 'gram', 8, 'Cap Kapal', 6000, 3),
  (58, 'Tepung Terigu', 'gram', 15, 'Segitiga Biru', 8000, 3),
  (59, 'Susu UHT', 'ml', 22, 'Ultra Milk', 8000, 3),
  (60, 'Kopi Arabica', 'gram', 110, 'PT Kopi Nusantara', 4000, 3),
  (61, 'Teh Hitam', 'gram', 80, 'Sariwangi', 2500, 3),
  (62, 'Es Batu', 'gram', 5, 'CV Aneka Es', 40000, 3),
  (63, 'Santan', 'ml', 40, 'Kara', 6000, 3),
  (64, 'Cabai Merah', 'gram', 60, 'Sayurku', 3000, 3);
SELECT setval('ingredients_id_seq', 64);

-- ============ MENUS (10 menus) ============
INSERT INTO menus (id, name, category, tenant_id) VALUES
  (41, 'Nasi Goreng Seafood', 'Main Dish', 3),
  (42, 'Ayam Geprek', 'Main Dish', 3),
  (43, 'Mie Ayam', 'Main Dish', 3),
  (44, 'Nasi Kuning', 'Main Dish', 3),
  (45, 'Capcay', 'Main Dish', 3),
  (46, 'Kopi Latte', 'Beverage', 3),
  (47, 'Es Teh Lemon', 'Beverage', 3),
  (48, 'Tahu Crispy', 'Snack', 3),
  (49, 'Kentang Goreng', 'Snack', 3),
  (50, 'Es Kelapa Muda', 'Beverage', 3);
SELECT setval('menus_id_seq', 50);

-- ============ MENU_INGREDIENTS ============
INSERT INTO menu_ingredients (menu_id, ingredient_id, qty, unit) VALUES
  -- Nasi Goreng Seafood (HPP: 300*15 + 1*2500 + 15*28 + 10*35 + 15*42 + 5*8 = 4500+2500+420+350+630+40 = 8440)
  (41, 49, 300, 'gram'), (41, 52, 1, 'pcs'), (41, 51, 15, 'ml'), (41, 53, 10, 'ml'), (41, 54, 15, 'gram'), (41, 57, 5, 'gram'),
  -- Ayam Geprek (HPP: 200*56 + 50*15 + 30*28 + 20*60 = 11200+750+840+1200 = 13990)
  (42, 50, 200, 'gram'), (42, 58, 50, 'gram'), (42, 51, 30, 'ml'), (42, 64, 20, 'gram'),
  -- Mie Ayam (HPP: 150*56 + 1*2500 + 10*28 + 10*42 = 8400+2500+280+420 = 11600)
  (43, 50, 150, 'gram'), (43, 52, 1, 'pcs'), (43, 51, 10, 'ml'), (43, 54, 10, 'gram'),
  -- Nasi Kuning (HPP: 300*15 + 80*40 + 5*8 = 4500+3200+40 = 7740)
  (44, 49, 300, 'gram'), (44, 63, 80, 'ml'), (44, 57, 5, 'gram'),
  -- Capcay (HPP: 150*56 + 1*2500 + 15*28 + 10*42 + 10*46 = 8400+2500+420+420+460 = 12200)
  (45, 50, 150, 'gram'), (45, 52, 1, 'pcs'), (45, 51, 15, 'ml'), (45, 54, 10, 'gram'), (45, 55, 10, 'gram'),
  -- Kopi Latte (HPP: 18*110 + 150*22 + 10*18 = 1980+3300+180 = 5460)
  (46, 60, 18, 'gram'), (46, 59, 150, 'ml'), (46, 56, 10, 'gram'),
  -- Es Teh Lemon (HPP: 5*80 + 20*18 + 150*5 = 400+360+750 = 1510)
  (47, 61, 5, 'gram'), (47, 56, 20, 'gram'), (47, 62, 150, 'gram'),
  -- Tahu Crispy (HPP: 50*15 + 30*28 + 5*8 = 750+840+40 = 1630)
  (48, 58, 50, 'gram'), (48, 51, 30, 'ml'), (48, 57, 5, 'gram'),
  -- Kentang Goreng (HPP: 80*15 + 40*28 = 1200+1120 = 2320)
  (49, 58, 80, 'gram'), (49, 51, 40, 'ml'),
  -- Es Kelapa Muda (HPP: 200*5 + 20*18 + 50*40 = 1000+360+2000 = 3360)
  (50, 62, 200, 'gram'), (50, 56, 20, 'gram'), (50, 63, 50, 'ml');

-- ============ MENU_PRICES ============
INSERT INTO menu_prices (menu_id, hpp, selling_price, start_date, is_active) VALUES
  (41, 8440, 28000, CURRENT_DATE, TRUE),
  (42, 13990, 28000, CURRENT_DATE, TRUE),
  (43, 11600, 25000, CURRENT_DATE, TRUE),
  (44, 7740, 20000, CURRENT_DATE, TRUE),
  (45, 12200, 28000, CURRENT_DATE, TRUE),
  (46, 5460, 20000, CURRENT_DATE, TRUE),
  (47, 1510, 8000, CURRENT_DATE, TRUE),
  (48, 1630, 10000, CURRENT_DATE, TRUE),
  (49, 2320, 12000, CURRENT_DATE, TRUE),
  (50, 3360, 15000, CURRENT_DATE, TRUE);

-- ============ DINING TABLES ============
INSERT INTO dining_tables (id, name, capacity, status, tenant_id) VALUES
  (10, 'Meja 1', 4, 'available', 3),
  (11, 'Meja 2', 4, 'available', 3),
  (12, 'Meja 3', 6, 'available', 3);
SELECT setval('dining_tables_id_seq', 12);

COMMIT;
