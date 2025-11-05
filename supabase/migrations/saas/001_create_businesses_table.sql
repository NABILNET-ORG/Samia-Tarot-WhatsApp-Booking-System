-- ==========================================
-- Migration 001: Create Businesses Table
-- Multi-Tenancy Core Table
-- ==========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- BUSINESSES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Business Information
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  industry TEXT CHECK (industry IN (
    'tarot', 'restaurant', 'clinic', 'salon', 'consultant',
    'fitness', 'education', 'ecommerce', 'real_estate', 'other'
  )),
  description TEXT,
  website_url TEXT,
  support_email TEXT,
  support_phone TEXT,

  -- Branding
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#6B46C1',
  secondary_color TEXT DEFAULT '#F59E0B',
  accent_color TEXT DEFAULT '#10B981',

  -- WhatsApp Configuration
  whatsapp_provider TEXT CHECK (whatsapp_provider IN ('meta', 'twilio')),
  whatsapp_number TEXT,
  whatsapp_profile_image_url TEXT,

  -- Meta WhatsApp (Encrypted)
  meta_phone_id TEXT,
  meta_access_token_encrypted TEXT,
  meta_app_secret_encrypted TEXT,
  meta_verify_token_encrypted TEXT,

  -- Twilio WhatsApp (Encrypted)
  twilio_account_sid_encrypted TEXT,
  twilio_auth_token_encrypted TEXT,
  twilio_whatsapp_number TEXT,

  -- Business Settings
  timezone TEXT DEFAULT 'UTC',
  business_hours_start TIME DEFAULT '09:00',
  business_hours_end TIME DEFAULT '20:00',
  business_days_of_week INT[] DEFAULT '{1,2,3,4,5}', -- Monday-Friday
  currency TEXT DEFAULT 'USD',
  language_primary TEXT DEFAULT 'en',
  language_secondary TEXT DEFAULT 'ar',
  languages_supported TEXT[] DEFAULT '{en,ar}',

  -- AI Configuration
  openai_api_key_encrypted TEXT,
  ai_model TEXT DEFAULT 'gpt-4o',
  ai_temperature DECIMAL DEFAULT 0.7,
  ai_max_tokens INT DEFAULT 700,
  ai_conversation_memory INT DEFAULT 10, -- Messages to remember

  -- Google Integration (Encrypted)
  google_client_id_encrypted TEXT,
  google_client_secret_encrypted TEXT,
  google_refresh_token_encrypted TEXT,
  google_calendar_id TEXT,

  -- Stripe Integration (Encrypted)
  stripe_secret_key_encrypted TEXT,
  stripe_publishable_key TEXT,
  stripe_webhook_secret_encrypted TEXT,

  -- Subscription & Billing
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN (
    'free',      -- 100 conversations/month, 1 employee
    'starter',   -- 1000 conversations/month, 3 employees
    'pro',       -- 5000 conversations/month, 10 employees
    'enterprise' -- Unlimited, unlimited employees
  )),
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN (
    'trial', 'active', 'past_due', 'canceled', 'paused'
  )),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMP DEFAULT NOW() + INTERVAL '14 days',
  subscription_started_at TIMESTAMP,
  subscription_canceled_at TIMESTAMP,
  subscription_pause_reason TEXT,

  -- Usage Limits & Tracking
  plan_max_conversations_monthly INT DEFAULT 100,
  plan_max_employees INT DEFAULT 1,
  plan_max_services INT DEFAULT 10,
  plan_max_voice_minutes_monthly DECIMAL DEFAULT 60.0,

  usage_conversations_current_month INT DEFAULT 0,
  usage_voice_minutes_current_month DECIMAL DEFAULT 0.0,
  usage_ai_tokens_current_month INT DEFAULT 0,
  usage_reset_date DATE DEFAULT DATE_TRUNC('month', NOW() + INTERVAL '1 month'),

  -- Features Enabled
  features_voice_transcription BOOLEAN DEFAULT false,
  features_google_calendar BOOLEAN DEFAULT false,
  features_google_contacts BOOLEAN DEFAULT false,
  features_custom_prompts BOOLEAN DEFAULT false,
  features_canned_responses BOOLEAN DEFAULT true,
  features_analytics_export BOOLEAN DEFAULT false,
  features_api_access BOOLEAN DEFAULT false,
  features_white_label BOOLEAN DEFAULT false,

  -- Status & Onboarding
  is_active BOOLEAN DEFAULT true,
  is_suspended BOOLEAN DEFAULT false,
  suspension_reason TEXT,
  is_onboarding_complete BOOLEAN DEFAULT false,
  onboarding_step INT DEFAULT 1, -- Steps: 1=Info, 2=WhatsApp, 3=Services, 4=Done
  onboarding_completed_at TIMESTAMP,

  -- Metadata
  settings_json JSONB DEFAULT '{}', -- Custom settings
  metadata_json JSONB DEFAULT '{}', -- Extra data
  tags TEXT[], -- For internal categorization

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP -- Soft delete
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE UNIQUE INDEX idx_businesses_slug ON businesses(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_businesses_active ON businesses(is_active, is_suspended) WHERE is_active = true AND is_suspended = false;
CREATE INDEX idx_businesses_subscription ON businesses(subscription_tier, subscription_status);
CREATE INDEX idx_businesses_trial ON businesses(trial_ends_at) WHERE subscription_status = 'trial';
CREATE INDEX idx_businesses_whatsapp_number ON businesses(whatsapp_number) WHERE deleted_at IS NULL;

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate slug from name if not provided
CREATE OR REPLACE FUNCTION generate_business_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM businesses WHERE slug = NEW.slug AND id != NEW.id) LOOP
      NEW.slug := NEW.slug || '-' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 8);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER businesses_generate_slug
  BEFORE INSERT OR UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION generate_business_slug();

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Employees can only see their own business
CREATE POLICY employees_own_business ON businesses
  FOR ALL
  USING (
    id = current_setting('app.current_business_id', true)::UUID
  );

-- Super admins can see all businesses
CREATE POLICY super_admin_all_businesses ON businesses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = current_setting('app.current_employee_id', true)::UUID
      AND email = ANY('{superadmin@platform.com, admin@platform.com}'::TEXT[])
    )
  );

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON TABLE businesses IS 'Multi-tenant core table - one row per business using the platform';
COMMENT ON COLUMN businesses.slug IS 'URL-friendly unique identifier for business';
COMMENT ON COLUMN businesses.meta_access_token_encrypted IS 'Encrypted Meta WhatsApp permanent access token';
COMMENT ON COLUMN businesses.subscription_tier IS 'Pricing plan: free (100/mo), starter (1K/mo), pro (5K/mo), enterprise (unlimited)';
COMMENT ON COLUMN businesses.usage_conversations_current_month IS 'Tracks usage against plan limits';

-- ==========================================
-- INITIAL DATA
-- ==========================================

-- Create platform owner business (for internal use)
INSERT INTO businesses (
  id,
  name,
  slug,
  industry,
  subscription_tier,
  subscription_status,
  is_onboarding_complete
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Platform Administration',
  'platform-admin',
  'other',
  'enterprise',
  'active',
  true
) ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- END OF MIGRATION 001
-- ==========================================
