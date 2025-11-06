-- Migration 011: Password Reset Tokens
-- CRITICAL: Enables password recovery flow

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token) WHERE used_at IS NULL;
CREATE INDEX idx_password_reset_tokens_employee ON password_reset_tokens(employee_id);
CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens(expires_at) WHERE used_at IS NULL;

-- RLS
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create reset tokens (public endpoint)
-- But only service role can query them (security)
CREATE POLICY password_reset_tokens_service_only ON password_reset_tokens
  USING (false); -- Only service role can access

-- Cleanup function for expired tokens (run daily)
CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_tokens
  WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE password_reset_tokens IS 'Temporary tokens for password reset flow - expires in 1 hour';
COMMENT ON COLUMN password_reset_tokens.token IS 'Cryptographically secure random token (64 chars)';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Token expires 1 hour after creation';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'Timestamp when token was used (prevents reuse)';
