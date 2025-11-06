-- Migration 009: Add WhatsApp Phone Number ID to Businesses
-- CRITICAL: Fixes multi-tenant webhook routing

-- Add WhatsApp phone number ID column for webhook routing
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT UNIQUE;

-- Add Twilio phone number column
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS twilio_phone_number TEXT UNIQUE;

-- Index for fast webhook lookups
CREATE INDEX IF NOT EXISTS idx_businesses_whatsapp_phone_id
  ON businesses(whatsapp_phone_number_id)
  WHERE whatsapp_phone_number_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_twilio_phone
  ON businesses(twilio_phone_number)
  WHERE twilio_phone_number IS NOT NULL;

-- Update Samia Tarot business with existing phone number ID (from .env)
UPDATE businesses
SET
  whatsapp_phone_number_id = '857683307429277',
  twilio_phone_number = '+17542916033'
WHERE name = 'Samia Tarot';

COMMENT ON COLUMN businesses.whatsapp_phone_number_id IS 'Meta WhatsApp Business phone number ID for webhook routing';
COMMENT ON COLUMN businesses.twilio_phone_number IS 'Twilio WhatsApp phone number for webhook routing';
