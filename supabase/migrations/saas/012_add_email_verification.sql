-- Migration 012: Email Verification
-- Add email verification tracking to employees

ALTER TABLE employees
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token) WHERE used_at IS NULL;
CREATE INDEX idx_email_verification_tokens_employee ON email_verification_tokens(employee_id);

ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_verification_tokens_service_only ON email_verification_tokens
  USING (false); -- Only service role can access

-- Mark existing employees as verified (migration compatibility)
UPDATE employees SET email_verified = true, email_verified_at = NOW() WHERE email_verified IS NULL;

COMMENT ON TABLE email_verification_tokens IS 'Tokens for email verification - expires in 24 hours';
