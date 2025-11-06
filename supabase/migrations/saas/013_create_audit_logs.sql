-- Migration 013: Audit Logs & Session Tracking

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_business ON audit_logs(business_id);
CREATE INDEX idx_audit_logs_employee ON audit_logs(employee_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_own_business ON audit_logs FOR SELECT
  USING (business_id = current_setting('app.current_business_id', true)::UUID);

-- Session tracking table
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  last_activity_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_active_sessions_employee ON active_sessions(employee_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_active_sessions_token ON active_sessions(token_hash);
CREATE INDEX idx_active_sessions_expires ON active_sessions(expires_at) WHERE revoked_at IS NULL;

ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE audit_logs IS 'Audit trail for all sensitive operations';
COMMENT ON TABLE active_sessions IS 'Track active JWT sessions for revocation';
