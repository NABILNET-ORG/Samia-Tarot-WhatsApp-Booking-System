-- Migration 015: Fix webhook_logs Missing Columns
-- Adds status and source columns before indexes reference them

-- Add missing columns to webhook_logs
ALTER TABLE webhook_logs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'received';
ALTER TABLE webhook_logs ADD COLUMN IF NOT EXISTS source TEXT;

-- Add check constraint for status
ALTER TABLE webhook_logs ADD CONSTRAINT webhook_logs_status_check
  CHECK (status IN ('received', 'processed', 'failed', 'ignored'));

-- Add check constraint for source
ALTER TABLE webhook_logs ADD CONSTRAINT webhook_logs_source_check
  CHECK (source IN ('meta', 'twilio', 'stripe', 'other'));

-- Add comments
COMMENT ON COLUMN webhook_logs.status IS 'Processing status of webhook';
COMMENT ON COLUMN webhook_logs.source IS 'Source of webhook (meta, twilio, stripe)';
