-- Migration 014: Add All Missing Encrypted Columns
-- Fixes schema mismatch between code and production database

-- Add Meta WhatsApp encrypted columns if missing
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS meta_access_token_encrypted TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS meta_app_secret_encrypted TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS meta_verify_token_encrypted TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT;

-- Add Twilio encrypted columns if missing
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS twilio_account_sid_encrypted TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS twilio_auth_token_encrypted TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS twilio_phone_number TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS twilio_whatsapp_number TEXT;

-- Add OpenAI encrypted column if missing
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS openai_api_key_encrypted TEXT;

-- Add Stripe encrypted columns if missing
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_secret_key_encrypted TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_publishable_key TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_webhook_secret_encrypted TEXT;

-- Add Google encrypted columns if missing
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_client_id_encrypted TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_client_secret_encrypted TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_refresh_token_encrypted TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_calendar_id TEXT;

-- Create indexes for webhook routing
CREATE INDEX IF NOT EXISTS idx_businesses_whatsapp_phone_id
  ON businesses(whatsapp_phone_number_id)
  WHERE whatsapp_phone_number_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_twilio_phone
  ON businesses(twilio_phone_number)
  WHERE twilio_phone_number IS NOT NULL;

-- Add comments
COMMENT ON COLUMN businesses.meta_access_token_encrypted IS 'Encrypted Meta WhatsApp access token';
COMMENT ON COLUMN businesses.meta_app_secret_encrypted IS 'Encrypted Meta WhatsApp app secret';
COMMENT ON COLUMN businesses.meta_verify_token_encrypted IS 'Encrypted Meta WhatsApp verify token';
COMMENT ON COLUMN businesses.whatsapp_phone_number_id IS 'Meta WhatsApp phone number ID for webhook routing';
COMMENT ON COLUMN businesses.openai_api_key_encrypted IS 'Encrypted OpenAI API key';
COMMENT ON COLUMN businesses.stripe_secret_key_encrypted IS 'Encrypted Stripe secret key';
COMMENT ON COLUMN businesses.google_client_secret_encrypted IS 'Encrypted Google OAuth client secret';
