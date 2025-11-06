-- Migration 011: Set Admin role for admin@samia-tarot.com

-- Update admin@samia-tarot.com to have Admin role
UPDATE employees
SET role_id = (SELECT id FROM roles WHERE name = 'Admin' LIMIT 1)
WHERE email = 'admin@samia-tarot.com';

COMMENT ON COLUMN employees.role_id IS 'References roles table - determines user permissions';
