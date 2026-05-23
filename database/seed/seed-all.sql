BEGIN;

-- ============ TENANTS ============
INSERT INTO tenants (id, slug, name, status) VALUES
  (1, 'warung-a', 'Warung A', 'active'),
  (2, 'warung-b', 'Warung B', 'active');
SELECT setval('tenants_id_seq', 2);

-- ============ SETTINGS ============
INSERT INTO settings (tenant_id, store_name, address, wifi_password, pb1_enabled, pb1_rate, service_enabled, service_rate, ppn_enabled, ppn_rate, qris_image_url, inventory_policy, point_value, point_per_rupiah)
VALUES
  (1, 'Warung A', 'Jl. Merdeka No. 10, Jakarta', 'warungA2026', TRUE, 10, TRUE, 5, FALSE, 11, '', 'medium', 1, 10000),
  (2, 'Warung B', 'Jl. Sudirman No. 25, Bandung', 'warungB2026', TRUE, 10, TRUE, 5, FALSE, 11, '', 'medium', 1, 10000);

-- ============ USERS (password = bcrypt hash of 'password') ============
-- Hash: $2a$10$8KzaNdKIMyOkASCBRPOJVeJf1sWL1Fj3MIgNpGkzRqQz1FZm5IbG
INSERT INTO users (id, fullname, username, email, password, role, active_tenant_id, is_active) VALUES
  (1, 'Super Admin', 'admin', 'admin@system.com', '$2a$10$8KzaNdKIMyOkASCBRPOJVeJf1sWL1Fj3MIgNpGkzRqQz1FZm5IbG', 'admin', NULL, TRUE),
  (2, 'Manager Warung A', 'manager_a', 'manager@warunga.com', '$2a$10$8KzaNdKIMyOkASCBRPOJVeJf1sWL1Fj3MIgNpGkzRqQz1FZm5IbG', 'manager', 1, TRUE),
  (3, 'Kasir A1', 'kasir_a1', 'kasir1@warunga.com', '$2a$10$8KzaNdKIMyOkASCBRPOJVeJf1sWL1Fj3MIgNpGkzRqQz1FZm5IbG', 'cashier', 1, TRUE),
  (4, 'Kasir A2', 'kasir_a2', 'kasir2@warunga.com', '$2a$10$8KzaNdKIMyOkASCBRPOJVeJf1sWL1Fj3MIgNpGkzRqQz1FZm5IbG', 'cashier', 1, TRUE),
  (5, 'Manager Warung B', 'manager_b', 'manager@warungb.com', '$2a$10$8KzaNdKIMyOkASCBRPOJVeJf1sWL1Fj3MIgNpGkzRqQz1FZm5IbG', 'manager', 2, TRUE),
  (6, 'Kasir B1', 'kasir_b1', 'kasir1@warungb.com', '$2a$10$8KzaNdKIMyOkASCBRPOJVeJf1sWL1Fj3MIgNpGkzRqQz1FZm5IbG', 'cashier', 2, TRUE),
  (7, 'Kasir B2', 'kasir_b2', 'kasir2@warungb.com', '$2a$10$8KzaNdKIMyOkASCBRPOJVeJf1sWL1Fj3MIgNpGkzRqQz1FZm5IbG', 'cashier', 2, TRUE);
SELECT setval('users_id_seq', 7);

-- ============ USER_TENANTS ============
INSERT INTO user_tenants (user_id, tenant_id, role, is_default) VALUES
  (2, 1, 'manager', TRUE),
  (3, 1, 'cashier', TRUE),
  (4, 1, 'cashier', TRUE),
  (5, 2, 'manager', TRUE),
  (6, 2, 'cashier', TRUE),
  (7, 2, 'cashier', TRUE);

-- ============ INGREDIENTS (Warung A) ============
INSERT INTO ingredients (id, name, base_unit, price_per_unit, supplier, stock, tenant_id) VALUES
  (1, 'Beras', 'gram', 15, 'PT Beras Jaya', 50000, 1),
  (2, 'Ayam Fillet', 'gram', 55, 'PT Sumber Protein', 10000, 1),
  (3, 'Minyak Goreng', 'ml', 28, 'Bimoli', 15000, 1),
  (4, 'Telur', 'pcs', 2500, 'Peternakan Sejahtera', 500, 1),
  (5, 'Kecap Manis', 'ml', 35, 'ABC', 5000, 1),
  (6, 'Bawang Merah', 'gram', 40, 'Sayurku', 5000, 1),
  (7, 'Bawang Putih', 'gram', 45, 'Sayurku', 4000, 1),
  (8, 'Cabai Merah', 'gram', 60, 'Sayurku', 3000, 1),
  (9, 'Gula Pasir', 'gram', 18, 'Gulaku', 10000, 1),
  (10, 'Garam', 'gram', 8, 'Cap Kapal', 8000, 1),
  (11, 'Tepung Terigu', 'gram', 15, 'Segitiga Biru', 10000, 1),
  (12, 'Susu UHT', 'ml', 22, 'Ultra Milk', 10000, 1),
  (13, 'Kopi Arabica', 'gram', 120, 'PT Kopi Nusantara', 5000, 1),
  (14, 'Teh Hitam', 'gram', 80, 'Sariwangi', 3000, 1),
  (15, 'Es Batu', 'gram', 5, 'CV Aneka Es', 50000, 1),
  (16, 'Santan', 'ml', 40, 'Kara', 8000, 1),
  (17, 'Daging Sapi', 'gram', 130, 'PT Daging Segar', 5000, 1),
  (18, 'Udang', 'gram', 90, 'Nelayan Jaya', 3000, 1),
  (19, 'Tahu', 'pcs', 1500, 'Tahu Sumedang', 200, 1),
  (20, 'Tempe', 'pcs', 2000, 'Tempe Murni', 200, 1),
  (21, 'Sayur Kangkung', 'gram', 20, 'Sayurku', 5000, 1),
  (22, 'Mie Telur', 'gram', 25, 'Burung Dara', 8000, 1),
  (23, 'Jeruk Nipis', 'pcs', 500, 'Petani Jeruk', 300, 1),
  (24, 'Kacang Tanah', 'gram', 45, 'PT Kacang', 5000, 1);

-- ============ INGREDIENTS (Warung B) ============
INSERT INTO ingredients (id, name, base_unit, price_per_unit, supplier, stock, tenant_id) VALUES
  (25, 'Beras', 'gram', 16, 'Toko Beras Makmur', 40000, 2),
  (26, 'Ayam Fillet', 'gram', 58, 'Ayam Segar', 8000, 2),
  (27, 'Minyak Goreng', 'ml', 30, 'Bimoli', 12000, 2),
  (28, 'Telur', 'pcs', 2600, 'Peternakan Bandung', 400, 2),
  (29, 'Kecap Manis', 'ml', 35, 'ABC', 4000, 2),
  (30, 'Bawang Merah', 'gram', 42, 'Pasar Bandung', 4000, 2),
  (31, 'Bawang Putih', 'gram', 48, 'Pasar Bandung', 3500, 2),
  (32, 'Cabai Merah', 'gram', 65, 'Pasar Bandung', 2500, 2),
  (33, 'Gula Pasir', 'gram', 18, 'Gulaku', 8000, 2),
  (34, 'Garam', 'gram', 8, 'Cap Kapal', 6000, 2),
  (35, 'Tepung Terigu', 'gram', 15, 'Segitiga Biru', 8000, 2),
  (36, 'Susu UHT', 'ml', 23, 'Greenfields', 8000, 2),
  (37, 'Kopi Robusta', 'gram', 80, 'Kopi Bandung', 4000, 2),
  (38, 'Teh Hitam', 'gram', 75, 'Tong Tji', 2500, 2),
  (39, 'Es Batu', 'gram', 5, 'Es Bandung', 40000, 2),
  (40, 'Santan', 'ml', 42, 'Kara', 6000, 2),
  (41, 'Ikan Gurame', 'gram', 75, 'Nelayan Bandung', 4000, 2),
  (42, 'Tahu', 'pcs', 1500, 'Tahu Sumedang', 150, 2),
  (43, 'Tempe', 'pcs', 2000, 'Tempe Bandung', 150, 2),
  (44, 'Sayur Bayam', 'gram', 18, 'Pasar Bandung', 4000, 2),
  (45, 'Mie Telur', 'gram', 25, 'Burung Dara', 6000, 2),
  (46, 'Jeruk Nipis', 'pcs', 500, 'Pasar Bandung', 200, 2),
  (47, 'Kacang Tanah', 'gram', 48, 'Pasar Bandung', 4000, 2),
  (48, 'Kerupuk', 'pcs', 300, 'Kerupuk Bandung', 500, 2);
SELECT setval('ingredients_id_seq', 48);

-- ============ MENUS (Warung A - 20 menus) ============
INSERT INTO menus (id, name, category, tenant_id) VALUES
  (1, 'Nasi Goreng Spesial', 'Main Dish', 1),
  (2, 'Ayam Goreng Kremes', 'Main Dish', 1),
  (3, 'Mie Goreng Jawa', 'Main Dish', 1),
  (4, 'Nasi Uduk', 'Main Dish', 1),
  (5, 'Soto Ayam', 'Main Dish', 1),
  (6, 'Rendang Sapi', 'Main Dish', 1),
  (7, 'Udang Goreng Tepung', 'Main Dish', 1),
  (8, 'Kangkung Tumis', 'Appetizer', 1),
  (9, 'Tahu Goreng', 'Appetizer', 1),
  (10, 'Tempe Mendoan', 'Appetizer', 1),
  (11, 'Sate Ayam', 'Main Dish', 1),
  (12, 'Kopi Susu', 'Beverage', 1),
  (13, 'Es Teh Manis', 'Beverage', 1),
  (14, 'Jus Jeruk', 'Beverage', 1),
  (15, 'Es Kopi Hitam', 'Beverage', 1),
  (16, 'Susu Coklat', 'Beverage', 1),
  (17, 'Pisang Goreng', 'Snack', 1),
  (18, 'Roti Bakar', 'Snack', 1),
  (19, 'Es Campur', 'Dessert', 1),
  (20, 'Kolak Pisang', 'Dessert', 1);

-- ============ MENUS (Warung B - 20 menus) ============
INSERT INTO menus (id, name, category, tenant_id) VALUES
  (21, 'Nasi Goreng Kampung', 'Main Dish', 2),
  (22, 'Ayam Bakar Madu', 'Main Dish', 2),
  (23, 'Mie Rebus', 'Main Dish', 2),
  (24, 'Nasi Liwet', 'Main Dish', 2),
  (25, 'Sop Ikan Gurame', 'Main Dish', 2),
  (26, 'Pecel Lele', 'Main Dish', 2),
  (27, 'Nasi Timbel', 'Main Dish', 2),
  (28, 'Sayur Bayam', 'Appetizer', 2),
  (29, 'Tahu Sumedang', 'Appetizer', 2),
  (30, 'Tempe Goreng', 'Appetizer', 2),
  (31, 'Sate Maranggi', 'Main Dish', 2),
  (32, 'Kopi Susu Gula Aren', 'Beverage', 2),
  (33, 'Es Teh Tarik', 'Beverage', 2),
  (34, 'Jus Alpukat', 'Beverage', 2),
  (35, 'Bandrek', 'Beverage', 2),
  (36, 'Susu Jahe', 'Beverage', 2),
  (37, 'Pisang Keju', 'Snack', 2),
  (38, 'Cireng', 'Snack', 2),
  (39, 'Es Cendol', 'Dessert', 2),
  (40, 'Surabi', 'Dessert', 2);
SELECT setval('menus_id_seq', 40);

-- ============ MENU_INGREDIENTS (Warung A) ============
INSERT INTO menu_ingredients (menu_id, ingredient_id, qty, unit) VALUES
  -- Nasi Goreng Spesial (HPP: 300*15 + 1*2500 + 15*28 + 10*35 + 15*40 + 5*10 = 4500+2500+420+350+600+50 = 8420)
  (1, 1, 300, 'gram'), (1, 4, 1, 'pcs'), (1, 3, 15, 'ml'), (1, 5, 10, 'ml'), (1, 6, 15, 'gram'), (1, 10, 5, 'gram'),
  -- Ayam Goreng Kremes (HPP: 250*55 + 50*28 + 30*15 + 1*2500 = 13750+1400+450+2500 = 18100)
  (2, 2, 250, 'gram'), (2, 3, 50, 'ml'), (2, 11, 30, 'gram'), (2, 4, 1, 'pcs'),
  -- Mie Goreng Jawa (HPP: 200*25 + 1*2500 + 10*28 + 10*35 + 10*40 = 5000+2500+280+350+400 = 8530)
  (3, 22, 200, 'gram'), (3, 4, 1, 'pcs'), (3, 3, 10, 'ml'), (3, 5, 10, 'ml'), (3, 6, 10, 'gram'),
  -- Nasi Uduk (HPP: 300*15 + 100*40 + 5*10 = 4500+4000+50 = 8550)
  (4, 1, 300, 'gram'), (4, 16, 100, 'ml'), (4, 10, 5, 'gram'),
  -- Soto Ayam (HPP: 200*55 + 300*15 + 20*40 + 10*45 + 5*10 = 11000+4500+800+450+50 = 16800)
  (5, 2, 200, 'gram'), (5, 1, 300, 'gram'), (5, 6, 20, 'gram'), (5, 7, 10, 'gram'), (5, 10, 5, 'gram'),
  -- Rendang Sapi (HPP: 200*130 + 150*40 + 20*40 + 10*45 + 10*60 = 26000+6000+800+450+600 = 33850)
  (6, 17, 200, 'gram'), (6, 16, 150, 'ml'), (6, 6, 20, 'gram'), (6, 7, 10, 'gram'), (6, 8, 10, 'gram'),
  -- Udang Goreng Tepung (HPP: 150*90 + 50*15 + 30*28 + 1*2500 = 13500+750+840+2500 = 17590)
  (7, 18, 150, 'gram'), (7, 11, 50, 'gram'), (7, 3, 30, 'ml'), (7, 4, 1, 'pcs'),
  -- Kangkung Tumis (HPP: 150*20 + 10*40 + 5*45 + 10*28 = 3000+400+225+280 = 3905)
  (8, 21, 150, 'gram'), (8, 6, 10, 'gram'), (8, 7, 5, 'gram'), (8, 3, 10, 'ml'),
  -- Tahu Goreng (HPP: 4*1500 + 20*28 = 6000+560 = 6560)
  (9, 19, 4, 'pcs'), (9, 3, 20, 'ml'),
  -- Tempe Mendoan (HPP: 3*2000 + 30*15 + 20*28 = 6000+450+560 = 7010)
  (10, 20, 3, 'pcs'), (10, 11, 30, 'gram'), (10, 3, 20, 'ml');

-- Sate Ayam (HPP: 200*55 + 10*35 + 30*45 + 10*28 = 11000+350+1350+280 = 12980)
INSERT INTO menu_ingredients (menu_id, ingredient_id, qty, unit) VALUES
  (11, 2, 200, 'gram'), (11, 5, 10, 'ml'), (11, 24, 30, 'gram'), (11, 3, 10, 'ml'),
  -- Kopi Susu (HPP: 18*120 + 100*22 + 10*18 = 2160+2200+180 = 4540)
  (12, 13, 18, 'gram'), (12, 12, 100, 'ml'), (12, 9, 10, 'gram'),
  -- Es Teh Manis (HPP: 5*80 + 20*18 + 150*5 = 400+360+750 = 1510)
  (13, 14, 5, 'gram'), (13, 9, 20, 'gram'), (13, 15, 150, 'gram'),
  -- Jus Jeruk (HPP: 3*500 + 15*18 + 100*5 = 1500+270+500 = 2270)
  (14, 23, 3, 'pcs'), (14, 9, 15, 'gram'), (14, 15, 100, 'gram'),
  -- Es Kopi Hitam (HPP: 15*120 + 10*18 + 150*5 = 1800+180+750 = 2730)
  (15, 13, 15, 'gram'), (15, 9, 10, 'gram'), (15, 15, 150, 'gram'),
  -- Susu Coklat (HPP: 200*22 + 20*18 = 4400+360 = 4760)
  (16, 12, 200, 'ml'), (16, 9, 20, 'gram'),
  -- Pisang Goreng (HPP: 50*15 + 20*28 + 10*18 = 750+560+180 = 1490) -- using tepung as proxy
  (17, 11, 50, 'gram'), (17, 3, 20, 'ml'), (17, 9, 10, 'gram'),
  -- Roti Bakar (HPP: 30*15 + 20*22 + 15*18 = 450+440+270 = 1160) -- simplified
  (18, 11, 30, 'gram'), (18, 12, 20, 'ml'), (18, 9, 15, 'gram'),
  -- Es Campur (HPP: 200*5 + 100*22 + 30*18 = 1000+2200+540 = 3740)
  (19, 15, 200, 'gram'), (19, 12, 100, 'ml'), (19, 9, 30, 'gram'),
  -- Kolak Pisang (HPP: 150*40 + 50*18 = 6000+900 = 6900)
  (20, 16, 150, 'ml'), (20, 9, 50, 'gram');

-- ============ MENU_INGREDIENTS (Warung B) ============
INSERT INTO menu_ingredients (menu_id, ingredient_id, qty, unit) VALUES
  -- Nasi Goreng Kampung (HPP: 300*16 + 1*2600 + 15*30 + 10*35 + 15*42 = 4800+2600+450+350+630 = 8830)
  (21, 25, 300, 'gram'), (21, 28, 1, 'pcs'), (21, 27, 15, 'ml'), (21, 29, 10, 'ml'), (21, 30, 15, 'gram'),
  -- Ayam Bakar Madu (HPP: 250*58 + 20*35 + 10*18 = 14500+700+180 = 15380)
  (22, 26, 250, 'gram'), (22, 29, 20, 'ml'), (22, 33, 10, 'gram'),
  -- Mie Rebus (HPP: 200*25 + 1*2600 + 10*42 + 5*34 = 5000+2600+420+170 = 8190)
  (23, 45, 200, 'gram'), (23, 28, 1, 'pcs'), (23, 30, 10, 'gram'), (23, 34, 5, 'gram'),
  -- Nasi Liwet (HPP: 300*16 + 100*42 + 5*8 = 4800+4200+40 = 9040)
  (24, 25, 300, 'gram'), (24, 40, 100, 'ml'), (24, 34, 5, 'gram'),
  -- Sop Ikan Gurame (HPP: 200*75 + 20*42 + 10*48 + 5*8 = 15000+840+480+40 = 16360)
  (25, 41, 200, 'gram'), (25, 30, 20, 'gram'), (25, 31, 10, 'gram'), (25, 34, 5, 'gram'),
  -- Pecel Lele (HPP: 300*16 + 50*30 + 20*65 + 30*48 = 4800+1500+1300+1440 = 9040)
  (26, 25, 300, 'gram'), (26, 27, 50, 'ml'), (26, 32, 20, 'gram'), (26, 47, 30, 'gram'),
  -- Nasi Timbel (HPP: 300*16 + 150*58 + 20*30 = 4800+8700+600 = 14100)
  (27, 25, 300, 'gram'), (27, 26, 150, 'gram'), (27, 27, 20, 'ml'),
  -- Sayur Bayam (HPP: 150*18 + 10*42 + 50*42 = 2700+420+2100 = 5220)
  (28, 44, 150, 'gram'), (28, 30, 10, 'gram'), (28, 40, 50, 'ml'),
  -- Tahu Sumedang (HPP: 5*1500 + 20*30 = 7500+600 = 8100)
  (29, 42, 5, 'pcs'), (29, 27, 20, 'ml'),
  -- Tempe Goreng (HPP: 3*2000 + 20*30 = 6000+600 = 6600)
  (30, 43, 3, 'pcs'), (30, 27, 20, 'ml');

-- Warung B continued
INSERT INTO menu_ingredients (menu_id, ingredient_id, qty, unit) VALUES
  -- Sate Maranggi (HPP: using ayam 200*58 + 10*35 + 20*48 = 11600+350+960 = 12910)
  (31, 26, 200, 'gram'), (31, 29, 10, 'ml'), (31, 47, 20, 'gram'),
  -- Kopi Susu Gula Aren (HPP: 18*80 + 100*23 + 15*18 = 1440+2300+270 = 4010)
  (32, 37, 18, 'gram'), (32, 36, 100, 'ml'), (32, 33, 15, 'gram'),
  -- Es Teh Tarik (HPP: 5*75 + 50*23 + 15*18 + 100*5 = 375+1150+270+500 = 2295)
  (33, 38, 5, 'gram'), (33, 36, 50, 'ml'), (33, 33, 15, 'gram'), (33, 39, 100, 'gram'),
  -- Jus Alpukat (HPP: 20*18 + 100*23 + 100*5 = 360+2300+500 = 3160)
  (34, 33, 20, 'gram'), (34, 36, 100, 'ml'), (34, 39, 100, 'gram'),
  -- Bandrek (HPP: 20*18 + 100*23 = 360+2300 = 2660) -- simplified
  (35, 33, 20, 'gram'), (35, 36, 100, 'ml'),
  -- Susu Jahe (HPP: 200*23 + 15*18 = 4600+270 = 4870)
  (36, 36, 200, 'ml'), (36, 33, 15, 'gram'),
  -- Pisang Keju (HPP: 50*15 + 20*30 + 10*18 = 750+600+180 = 1530)
  (37, 35, 50, 'gram'), (37, 27, 20, 'ml'), (37, 33, 10, 'gram'),
  -- Cireng (HPP: 80*15 + 20*30 = 1200+600 = 1800)
  (38, 35, 80, 'gram'), (38, 27, 20, 'ml'),
  -- Es Cendol (HPP: 200*5 + 100*42 + 30*18 = 1000+4200+540 = 5740)
  (39, 39, 200, 'gram'), (39, 40, 100, 'ml'), (39, 33, 30, 'gram'),
  -- Surabi (HPP: 80*15 + 50*42 + 20*18 = 1200+2100+360 = 3660)
  (40, 35, 80, 'gram'), (40, 40, 50, 'ml'), (40, 33, 20, 'gram');

-- ============ MENU_PRICES ============
INSERT INTO menu_prices (menu_id, hpp, selling_price, start_date, is_active) VALUES
  (1, 8420, 25000, CURRENT_DATE, TRUE),
  (2, 18100, 35000, CURRENT_DATE, TRUE),
  (3, 8530, 25000, CURRENT_DATE, TRUE),
  (4, 8550, 20000, CURRENT_DATE, TRUE),
  (5, 16800, 30000, CURRENT_DATE, TRUE),
  (6, 33850, 55000, CURRENT_DATE, TRUE),
  (7, 17590, 35000, CURRENT_DATE, TRUE),
  (8, 3905, 15000, CURRENT_DATE, TRUE),
  (9, 6560, 12000, CURRENT_DATE, TRUE),
  (10, 7010, 15000, CURRENT_DATE, TRUE),
  (11, 12980, 30000, CURRENT_DATE, TRUE),
  (12, 4540, 18000, CURRENT_DATE, TRUE),
  (13, 1510, 8000, CURRENT_DATE, TRUE),
  (14, 2270, 12000, CURRENT_DATE, TRUE),
  (15, 2730, 15000, CURRENT_DATE, TRUE),
  (16, 4760, 15000, CURRENT_DATE, TRUE),
  (17, 1490, 10000, CURRENT_DATE, TRUE),
  (18, 1160, 12000, CURRENT_DATE, TRUE),
  (19, 3740, 15000, CURRENT_DATE, TRUE),
  (20, 6900, 15000, CURRENT_DATE, TRUE),
  (21, 8830, 25000, CURRENT_DATE, TRUE),
  (22, 15380, 35000, CURRENT_DATE, TRUE),
  (23, 8190, 22000, CURRENT_DATE, TRUE),
  (24, 9040, 22000, CURRENT_DATE, TRUE),
  (25, 16360, 35000, CURRENT_DATE, TRUE),
  (26, 9040, 25000, CURRENT_DATE, TRUE),
  (27, 14100, 30000, CURRENT_DATE, TRUE),
  (28, 5220, 12000, CURRENT_DATE, TRUE),
  (29, 8100, 15000, CURRENT_DATE, TRUE),
  (30, 6600, 12000, CURRENT_DATE, TRUE),
  (31, 12910, 32000, CURRENT_DATE, TRUE),
  (32, 4010, 18000, CURRENT_DATE, TRUE),
  (33, 2295, 10000, CURRENT_DATE, TRUE),
  (34, 3160, 15000, CURRENT_DATE, TRUE),
  (35, 2660, 12000, CURRENT_DATE, TRUE),
  (36, 4870, 15000, CURRENT_DATE, TRUE),
  (37, 1530, 12000, CURRENT_DATE, TRUE),
  (38, 1800, 10000, CURRENT_DATE, TRUE),
  (39, 5740, 15000, CURRENT_DATE, TRUE),
  (40, 3660, 12000, CURRENT_DATE, TRUE);

-- ============ MEMBERS (Warung A - 10 members) ============
INSERT INTO members (id, name, email, phone, location, tier, points_balance, visit_count, total_spending, last_visit_at, tenant_id) VALUES
  (1, 'Andi Pratama', 'andi.p@email.com', '0812-1111-0001', 'Jakarta Selatan', 'Bronze', 0, 0, 0, NULL, 1),
  (2, 'Budi Setiawan', 'budi.s@email.com', '0812-1111-0002', 'Jakarta Timur', 'Bronze', 0, 0, 0, NULL, 1),
  (3, 'Citra Dewi', 'citra.d@email.com', '0812-1111-0003', 'Jakarta Barat', 'Bronze', 0, 0, 0, NULL, 1),
  (4, 'Dian Permata', 'dian.p@email.com', '0812-1111-0004', 'Jakarta Pusat', 'Bronze', 0, 0, 0, NULL, 1),
  (5, 'Eko Saputra', 'eko.s@email.com', '0812-1111-0005', 'Tangerang', 'Bronze', 0, 0, 0, NULL, 1),
  (6, 'Fitri Handayani', 'fitri.h@email.com', '0812-1111-0006', 'Depok', 'Bronze', 0, 0, 0, NULL, 1),
  (7, 'Gunawan Wibowo', 'gunawan.w@email.com', '0812-1111-0007', 'Bekasi', 'Bronze', 0, 0, 0, NULL, 1),
  (8, 'Hana Safitri', 'hana.s@email.com', '0812-1111-0008', 'Jakarta Selatan', 'Bronze', 0, 0, 0, NULL, 1),
  (9, 'Irfan Hakim', 'irfan.h@email.com', '0812-1111-0009', 'Jakarta Utara', 'Bronze', 0, 0, 0, NULL, 1),
  (10, 'Joko Widodo', 'joko.w@email.com', '0812-1111-0010', 'Bogor', 'Bronze', 0, 0, 0, NULL, 1);
SELECT setval('members_id_seq', 10);

-- ============ SUPPLIERS ============
INSERT INTO suppliers (id, name, contact_phone, address) VALUES
  (1, 'PT Beras Jaya', '021-5550001', 'Jakarta'),
  (2, 'PT Sumber Protein', '021-5550002', 'Jakarta'),
  (3, 'Bimoli', '021-5550003', 'Jakarta'),
  (4, 'Sayurku', '021-5550004', 'Jakarta'),
  (5, 'Toko Beras Makmur', '022-5550001', 'Bandung'),
  (6, 'Ayam Segar', '022-5550002', 'Bandung'),
  (7, 'Pasar Bandung', '022-5550003', 'Bandung');
SELECT setval('suppliers_id_seq', 7);

-- ============ DINING TABLES ============
INSERT INTO dining_tables (id, name, capacity, status, tenant_id) VALUES
  (1, 'Meja 1', 4, 'available', 1),
  (2, 'Meja 2', 4, 'available', 1),
  (3, 'Meja 3', 6, 'available', 1),
  (4, 'Meja 4', 2, 'available', 1),
  (5, 'Meja 5', 8, 'available', 1),
  (6, 'Meja 1', 4, 'available', 2),
  (7, 'Meja 2', 4, 'available', 2),
  (8, 'Meja 3', 6, 'available', 2),
  (9, 'Meja 4', 2, 'available', 2);
SELECT setval('dining_tables_id_seq', 9);

-- ============ ADDONS ============
INSERT INTO addons (id, name, price, tenant_id) VALUES
  (1, 'Extra Telur', 5000, 1),
  (2, 'Extra Nasi', 5000, 1),
  (3, 'Extra Ayam', 10000, 1),
  (4, 'Sambal Extra', 3000, 1),
  (5, 'Kerupuk', 3000, 1),
  (6, 'Extra Shot Kopi', 5000, 1),
  (7, 'Extra Telur', 5000, 2),
  (8, 'Extra Nasi', 5000, 2),
  (9, 'Extra Ayam', 12000, 2),
  (10, 'Sambal Extra', 3000, 2),
  (11, 'Kerupuk', 2000, 2),
  (12, 'Extra Gula Aren', 3000, 2);
SELECT setval('addons_id_seq', 12);

-- ============ MENU_ADDON_ASSIGNMENTS ============
INSERT INTO menu_addon_assignments (menu_id, addon_id, tenant_id) VALUES
  (1, 1, 1), (1, 2, 1), (1, 5, 1),
  (2, 2, 1), (2, 4, 1), (2, 5, 1),
  (3, 1, 1), (3, 5, 1),
  (5, 2, 1), (5, 3, 1),
  (11, 2, 1), (11, 4, 1),
  (12, 6, 1),
  (21, 7, 2), (21, 8, 2), (21, 11, 2),
  (22, 8, 2), (22, 10, 2), (22, 11, 2),
  (23, 7, 2), (23, 11, 2),
  (25, 8, 2),
  (31, 8, 2), (31, 10, 2),
  (32, 12, 2);

COMMIT;
