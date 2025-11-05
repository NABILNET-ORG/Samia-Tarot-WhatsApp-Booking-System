-- ==========================================
-- Migration 002: Create Employees & Roles Tables
-- Employee Accounts & Permission System
-- ==========================================

-- ==========================================
-- ROLES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,

  -- Role Definition
  name TEXT NOT NULL, -- 'admin', 'manager', 'agent', 'viewer'
  display_name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6B46C1',

  -- Permissions
  permissions_json JSONB NOT NULL DEFAULT '{
    "conversations": {
      "view": true,
      "takeover": false,
      "send_message": false,
      "assign": false,
      "delete": false,
      "export": false
    },
    "bookings": {
      "view": true,
      "create": false,
      "edit": false,
      "delete": false,
      "refund": false
    },
    "customers": {
      "view": true,
      "edit": false,
      "delete": false,
      "export": false
    },
    "services": {
      "view": true,
      "create": false,
      "edit": false,
      "delete": false
    },
    "analytics": {
      "view": true,
      "export": false,
      "view_revenue": false
    },
    "employees": {
      "view": false,
      "invite": false,
      "edit": false,
      "delete": false
    },
    "settings": {
      "view": true,
      "edit": false,
      "whatsapp": false,
      "billing": false
    },
    "prompts": {
      "view": false,
      "edit": false,
      "test": false
    },
    "templates": {
      "view": true,
      "create": false,
      "edit": false,
      "delete": false
    }
  }'::JSONB,

  -- Metadata
  is_system_role BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_roles_name_business ON roles(name, business_id) WHERE is_active = true;
CREATE INDEX idx_roles_business ON roles(business_id);

-- ==========================================
-- EMPLOYEES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Authentication
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  email_verification_token TEXT,
  email_verification_expires_at TIMESTAMP,
  password_reset_token TEXT,
  password_reset_expires_at TIMESTAMP,

  -- Profile
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  bio TEXT,
  preferred_language TEXT DEFAULT 'en',

  -- Role & Permissions
  role_id UUID REFERENCES roles(id),
  custom_permissions_json JSONB DEFAULT '{}', -- Overrides role permissions

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_online BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMP,

  -- Activity Stats
  last_login_at TIMESTAMP,
  total_conversations_handled INT DEFAULT 0,
  total_bookings_closed INT DEFAULT 0,
  total_messages_sent INT DEFAULT 0,
  avg_response_time_seconds INT,
  customer_satisfaction_score DECIMAL, -- 1.0 to 5.0

  -- Notification Preferences
  notification_email BOOLEAN DEFAULT true,
  notification_push BOOLEAN DEFAULT true,
  notification_sound BOOLEAN DEFAULT true,
  notification_new_conversation BOOLEAN DEFAULT true,
  notification_new_message BOOLEAN DEFAULT true,
  notification_new_booking BOOLEAN DEFAULT true,
  notification_payment_received BOOLEAN DEFAULT true,
  notification_support_request BOOLEAN DEFAULT true,

  notification_quiet_hours_start TIME,
  notification_quiet_hours_end TIME,

  -- Work Schedule
  work_schedule_json JSONB DEFAULT '{
    "monday": {"enabled": true, "start": "09:00", "end": "17:00"},
    "tuesday": {"enabled": true, "start": "09:00", "end": "17:00"},
    "wednesday": {"enabled": true, "start": "09:00", "end": "17:00"},
    "thursday": {"enabled": true, "start": "09:00", "end": "17:00"},
    "friday": {"enabled": true, "start": "09:00", "end": "17:00"},
    "saturday": {"enabled": false},
    "sunday": {"enabled": false}
  }'::JSONB,

  -- Metadata
  metadata_json JSONB DEFAULT '{}',
  tags TEXT[],

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  invited_at TIMESTAMP,
  invited_by UUID REFERENCES employees(id),
  deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX idx_employees_email_business ON employees(email, business_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_business ON employees(business_id);
CREATE INDEX idx_employees_active ON employees(business_id, is_active) WHERE is_active = true;
CREATE INDEX idx_employees_online ON employees(business_id, is_online) WHERE is_online = true;
CREATE INDEX idx_employees_role ON employees(role_id);

-- ==========================================
-- CONVERSATION ASSIGNMENTS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS conversation_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Assignment
  assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES employees(id),
  assignment_type TEXT DEFAULT 'manual' CHECK (assignment_type IN ('auto', 'manual', 'escalation', 'round_robin')),
  assignment_reason TEXT,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'transferred', 'abandoned')),

  -- Mode Tracking
  mode TEXT DEFAULT 'ai' CHECK (mode IN ('ai', 'human', 'hybrid')),
  taken_over_at TIMESTAMP,
  taken_over_by UUID REFERENCES employees(id),
  handed_back_at TIMESTAMP,
  handed_back_reason TEXT,

  -- Performance Metrics
  first_response_time_seconds INT,
  avg_response_time_seconds INT,
  total_messages_sent INT DEFAULT 0,
  customer_satisfaction INT CHECK (customer_satisfaction BETWEEN 1 AND 5),

  -- Timestamps
  assigned_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  transferred_at TIMESTAMP,
  transferred_to UUID REFERENCES employees(id)
);

CREATE INDEX idx_conversation_assignments_conversation ON conversation_assignments(conversation_id);
CREATE INDEX idx_conversation_assignments_employee ON conversation_assignments(assigned_to, status) WHERE status = 'active';
CREATE INDEX idx_conversation_assignments_business ON conversation_assignments(business_id, status);

-- ==========================================
-- INTERNAL NOTES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS internal_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,

  -- Note Content
  note TEXT NOT NULL,
  note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'warning', 'follow_up', 'reminder', 'vip')),

  -- Visibility & Priority
  is_pinned BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  mentioned_employee_ids UUID[], -- @mentions

  -- Created By
  created_by UUID NOT NULL REFERENCES employees(id),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_internal_notes_conversation ON internal_notes(conversation_id, created_at DESC);
CREATE INDEX idx_internal_notes_customer ON internal_notes(customer_id, created_at DESC);
CREATE INDEX idx_internal_notes_business ON internal_notes(business_id, is_pinned) WHERE is_pinned = true;

-- ==========================================
-- ACTIVITY LOGS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,

  -- Action Details
  action TEXT NOT NULL,
  action_category TEXT CHECK (action_category IN (
    'conversations', 'bookings', 'customers', 'services',
    'employees', 'settings', 'prompts', 'templates', 'auth'
  )),
  action_type TEXT CHECK (action_type IN ('create', 'read', 'update', 'delete', 'login', 'logout')),
  description TEXT,

  -- Resource
  resource_type TEXT,
  resource_id UUID,
  resource_name TEXT, -- Cached for display

  -- Changes (for edit actions)
  changes_before_json JSONB,
  changes_after_json JSONB,

  -- Request Metadata
  ip_address INET,
  user_agent TEXT,
  request_method TEXT,
  request_path TEXT,

  -- Additional Data
  metadata_json JSONB DEFAULT '{}',
  tags TEXT[],

  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_business ON activity_logs(business_id, created_at DESC);
CREATE INDEX idx_activity_logs_employee ON activity_logs(employee_id, created_at DESC);
CREATE INDEX idx_activity_logs_resource ON activity_logs(resource_type, resource_id);
CREATE INDEX idx_activity_logs_category ON activity_logs(business_id, action_category, created_at DESC);

-- ==========================================
-- TRIGGERS
-- ==========================================

CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER internal_notes_updated_at
  BEFORE UPDATE ON internal_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- DEFAULT ROLES
-- ==========================================

-- Function to create default roles for a business
CREATE OR REPLACE FUNCTION create_default_roles(p_business_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Business Admin Role
  INSERT INTO roles (business_id, name, display_name, description, is_system_role, permissions_json)
  VALUES (
    p_business_id,
    'admin',
    'Business Administrator',
    'Full access to all features and settings',
    true,
    '{
      "conversations": {"view": true, "takeover": true, "send_message": true, "assign": true, "delete": true, "export": true},
      "bookings": {"view": true, "create": true, "edit": true, "delete": true, "refund": true},
      "customers": {"view": true, "edit": true, "delete": true, "export": true},
      "services": {"view": true, "create": true, "edit": true, "delete": true},
      "analytics": {"view": true, "export": true, "view_revenue": true},
      "employees": {"view": true, "invite": true, "edit": true, "delete": true},
      "settings": {"view": true, "edit": true, "whatsapp": true, "billing": true},
      "prompts": {"view": true, "edit": true, "test": true},
      "templates": {"view": true, "create": true, "edit": true, "delete": true}
    }'::JSONB
  );

  -- Manager Role
  INSERT INTO roles (business_id, name, display_name, description, is_system_role, permissions_json)
  VALUES (
    p_business_id,
    'manager',
    'Manager',
    'Manage conversations and view analytics',
    true,
    '{
      "conversations": {"view": true, "takeover": true, "send_message": true, "assign": true, "delete": false, "export": true},
      "bookings": {"view": true, "create": true, "edit": true, "delete": false, "refund": false},
      "customers": {"view": true, "edit": true, "delete": false, "export": true},
      "services": {"view": true, "create": false, "edit": true, "delete": false},
      "analytics": {"view": true, "export": true, "view_revenue": true},
      "employees": {"view": true, "invite": false, "edit": false, "delete": false},
      "settings": {"view": true, "edit": false, "whatsapp": false, "billing": false},
      "prompts": {"view": true, "edit": false, "test": true},
      "templates": {"view": true, "create": true, "edit": true, "delete": false}
    }'::JSONB
  );

  -- Agent Role
  INSERT INTO roles (business_id, name, display_name, description, is_system_role, permissions_json)
  VALUES (
    p_business_id,
    'agent',
    'Support Agent',
    'Handle customer conversations',
    true,
    '{
      "conversations": {"view": true, "takeover": true, "send_message": true, "assign": false, "delete": false, "export": false},
      "bookings": {"view": true, "create": true, "edit": false, "delete": false, "refund": false},
      "customers": {"view": true, "edit": false, "delete": false, "export": false},
      "services": {"view": true, "create": false, "edit": false, "delete": false},
      "analytics": {"view": false, "export": false, "view_revenue": false},
      "employees": {"view": false, "invite": false, "edit": false, "delete": false},
      "settings": {"view": false, "edit": false, "whatsapp": false, "billing": false},
      "prompts": {"view": false, "edit": false, "test": false},
      "templates": {"view": true, "create": false, "edit": false, "delete": false}
    }'::JSONB
  );

  -- Viewer Role
  INSERT INTO roles (business_id, name, display_name, description, is_system_role, permissions_json)
  VALUES (
    p_business_id,
    'viewer',
    'Viewer',
    'Read-only access to conversations and analytics',
    true,
    '{
      "conversations": {"view": true, "takeover": false, "send_message": false, "assign": false, "delete": false, "export": false},
      "bookings": {"view": true, "create": false, "edit": false, "delete": false, "refund": false},
      "customers": {"view": true, "edit": false, "delete": false, "export": false},
      "services": {"view": true, "create": false, "edit": false, "delete": false},
      "analytics": {"view": true, "export": false, "view_revenue": false},
      "employees": {"view": false, "invite": false, "edit": false, "delete": false},
      "settings": {"view": true, "edit": false, "whatsapp": false, "billing": false},
      "prompts": {"view": false, "edit": false, "test": false},
      "templates": {"view": true, "create": false, "edit": false, "delete": false}
    }'::JSONB
  );
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- TRIGGER: Auto-create roles for new business
-- ==========================================

CREATE OR REPLACE FUNCTION create_default_roles_trigger()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_roles(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER businesses_create_default_roles
  AFTER INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION create_default_roles_trigger();

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Employees can only see their own business
CREATE POLICY employees_own_business ON employees
  FOR ALL
  USING (business_id = current_setting('app.current_business_id', true)::UUID);

CREATE POLICY roles_own_business ON roles
  FOR ALL
  USING (business_id = current_setting('app.current_business_id', true)::UUID);

CREATE POLICY conversation_assignments_own_business ON conversation_assignments
  FOR ALL
  USING (business_id = current_setting('app.current_business_id', true)::UUID);

CREATE POLICY internal_notes_own_business ON internal_notes
  FOR ALL
  USING (business_id = current_setting('app.current_business_id', true)::UUID);

CREATE POLICY activity_logs_own_business ON activity_logs
  FOR ALL
  USING (business_id = current_setting('app.current_business_id', true)::UUID);

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON TABLE roles IS 'Permission roles for employees (admin, manager, agent, viewer)';
COMMENT ON TABLE employees IS 'Business team member accounts with authentication';
COMMENT ON TABLE conversation_assignments IS 'Tracks which employee is handling which conversation';
COMMENT ON TABLE internal_notes IS 'Private notes between employees about conversations/customers';
COMMENT ON TABLE activity_logs IS 'Audit trail of all employee actions';

-- ==========================================
-- END OF MIGRATION 002
-- ==========================================
