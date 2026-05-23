BEGIN;

-- Create default tenant
INSERT INTO tenants (slug, name, status)
VALUES ('default', 'Warung Kita', 'active')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status, updated_at = NOW();

-- Create super admin user
INSERT INTO users (fullname, username, email, password, role, is_active, active_tenant_id)
VALUES (
  'Super Admin',
  'superadmin',
  'admin@warungkita.com',
  'admin123',
  'admin',
  TRUE,
  (SELECT id FROM tenants WHERE slug = 'default')
)
ON CONFLICT (email) DO UPDATE SET
  fullname = EXCLUDED.fullname,
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  is_active = TRUE,
  active_tenant_id = EXCLUDED.active_tenant_id,
  updated_at = NOW();

-- Link user to tenant
INSERT INTO user_tenants (user_id, tenant_id, role, is_default)
SELECT u.id, t.id, 'admin', TRUE
FROM users u
CROSS JOIN tenants t
WHERE u.username = 'superadmin' AND t.slug = 'default'
ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = 'admin', is_default = TRUE, updated_at = NOW();

COMMIT;
