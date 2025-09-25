-- Insert default roles
INSERT INTO roles (name, description) VALUES
    ('Super Admin', 'Full system access with all permissions'),
    ('Admin', 'Administrative access to most features'),
    ('Manager', 'Management access to assigned areas'),
    ('User', 'Basic user access'),
    ('Viewer', 'Read-only access to assigned resources')
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action) VALUES
    -- User management permissions
    ('users.create', 'Create new users', 'users', 'create'),
    ('users.read', 'View user information', 'users', 'read'),
    ('users.update', 'Update user information', 'users', 'update'),
    ('users.delete', 'Delete users', 'users', 'delete'),
    ('users.manage_roles', 'Assign/remove user roles', 'users', 'manage_roles'),
    
    -- Role management permissions
    ('roles.create', 'Create new roles', 'roles', 'create'),
    ('roles.read', 'View role information', 'roles', 'read'),
    ('roles.update', 'Update role information', 'roles', 'update'),
    ('roles.delete', 'Delete roles', 'roles', 'delete'),
    ('roles.manage_permissions', 'Assign/remove role permissions', 'roles', 'manage_permissions'),
    
    -- Permission management permissions
    ('permissions.read', 'View permission information', 'permissions', 'read'),
    ('permissions.create', 'Create new permissions', 'permissions', 'create'),
    ('permissions.update', 'Update permission information', 'permissions', 'update'),
    ('permissions.delete', 'Delete permissions', 'permissions', 'delete'),
    
    -- Claims management permissions (based on existing tables)
    ('claims.create', 'Create new claims', 'claims', 'create'),
    ('claims.read', 'View claim information', 'claims', 'read'),
    ('claims.update', 'Update claim information', 'claims', 'update'),
    ('claims.delete', 'Delete claims', 'claims', 'delete'),
    
    -- Vendor management permissions
    ('vendors.create', 'Create new vendors', 'vendors', 'create'),
    ('vendors.read', 'View vendor information', 'vendors', 'read'),
    ('vendors.update', 'Update vendor information', 'vendors', 'update'),
    ('vendors.delete', 'Delete vendors', 'vendors', 'delete'),
    
    -- Dashboard and reporting permissions
    ('dashboard.view', 'Access dashboard', 'dashboard', 'read'),
    ('reports.view', 'View reports', 'reports', 'read'),
    ('reports.export', 'Export reports', 'reports', 'export')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to Super Admin role (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Super Admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to Admin role (most permissions except user deletion and role management)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Admin'
AND p.name NOT IN ('users.delete', 'roles.delete', 'permissions.delete')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to Manager role (read/update for most resources)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Manager'
AND p.action IN ('read', 'update')
AND p.resource IN ('users', 'claims', 'vendors', 'dashboard', 'reports')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to User role (basic access)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'User'
AND p.name IN ('dashboard.view', 'claims.read', 'vendors.read', 'users.read')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to Viewer role (read-only access)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Viewer'
AND p.action = 'read'
ON CONFLICT (role_id, permission_id) DO NOTHING;
