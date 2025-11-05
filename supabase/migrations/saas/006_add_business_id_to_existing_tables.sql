-- Migration 006: Add business_id to Existing Tables
-- Retrofit Multi-Tenancy

-- Add business_id to customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
CREATE INDEX IF NOT EXISTS idx_customers_business ON customers(business_id, phone);

-- Add business_id and mode to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'ai' CHECK (mode IN ('ai', 'human', 'hybrid'));
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES employees(id);
CREATE INDEX IF NOT EXISTS idx_conversations_business ON conversations(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned ON conversations(assigned_to, is_active) WHERE is_active = true;

-- Add business_id to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS handled_by UUID REFERENCES employees(id);
CREATE INDEX IF NOT EXISTS idx_bookings_business ON bookings(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_employee ON bookings(handled_by);

-- Add business_id to services
ALTER TABLE services ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
CREATE INDEX IF NOT EXISTS idx_services_business ON services(business_id, is_active) WHERE is_active = true;

-- Add business_id to analytics_events
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_business ON analytics_events(business_id, created_at DESC);

-- Add business_id to webhook_logs
ALTER TABLE webhook_logs ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_business ON webhook_logs(business_id, created_at DESC);

-- Add business_id to admin_notifications
ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_employee ON admin_notifications(employee_id, is_read);

-- Migrate existing data to first business (Samia Tarot)
-- This will be run after creating the first business
CREATE OR REPLACE FUNCTION migrate_existing_data_to_business(p_business_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE customers SET business_id = p_business_id WHERE business_id IS NULL;
  UPDATE conversations SET business_id = p_business_id WHERE business_id IS NULL;
  UPDATE bookings SET business_id = p_business_id WHERE business_id IS NULL;
  UPDATE services SET business_id = p_business_id WHERE business_id IS NULL;
  UPDATE analytics_events SET business_id = p_business_id WHERE business_id IS NULL;
  UPDATE webhook_logs SET business_id = p_business_id WHERE business_id IS NULL;
  UPDATE admin_notifications SET business_id = p_business_id WHERE business_id IS NULL;
END;
$$ LANGUAGE plpgsql;
