-- ==========================================
-- 🔮 SAMIA TAROT - SUPABASE DATABASE SCHEMA
-- ==========================================
-- Run this in Supabase SQL Editor
-- Created: 2025
-- Version: 2.0 with Supabase Integration
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1️⃣ CUSTOMERS TABLE
-- ==========================================
-- Stores all customer information
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  name_english TEXT,
  name_arabic TEXT,
  email TEXT,
  preferred_language TEXT CHECK (preferred_language IN ('ar', 'en')) DEFAULT 'ar',
  country_code TEXT,
  first_booking_date TIMESTAMP WITH TIME ZONE,
  last_booking_date TIMESTAMP WITH TIME ZONE,
  total_bookings INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  average_booking_value DECIMAL(10,2) DEFAULT 0.00,
  vip_status BOOLEAN DEFAULT false,
  google_contact_id TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_vip ON customers(vip_status);
CREATE INDEX IF NOT EXISTS idx_customers_created ON customers(created_at DESC);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 2️⃣ CONVERSATIONS TABLE
-- ==========================================
-- Stores active conversation state (AI memory!)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  current_state TEXT NOT NULL DEFAULT 'GREETING',
  -- States: GREETING, GENERAL_QUESTION, SHOW_SERVICES, ASK_NAME, ASK_EMAIL, PAYMENT, SUPPORT_REQUEST
  selected_service INTEGER,
  service_name TEXT,
  full_name TEXT,
  email TEXT,
  language TEXT CHECK (language IN ('ar', 'en')) DEFAULT 'ar',
  message_history JSONB DEFAULT '[]'::jsonb,
  -- Array of {role: 'user'|'assistant', content: 'text', timestamp: '2025-01-01T12:00:00Z'}
  context_data JSONB DEFAULT '{}'::jsonb,
  -- Any additional context (selected payment method, etc.)
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
  -- Auto-cleanup old conversations
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_phone ON conversations(phone);
CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_active ON conversations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_conversations_expires ON conversations(expires_at);
CREATE INDEX IF NOT EXISTS idx_conversations_state ON conversations(current_state);

-- Trigger
CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 3️⃣ BOOKINGS TABLE
-- ==========================================
-- Complete booking records
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  service_id INTEGER NOT NULL,
  service_name TEXT NOT NULL,
  service_type TEXT CHECK (service_type IN ('reading', 'call', 'support')),
  service_tier TEXT CHECK (service_tier IN ('standard', 'premium', 'golden', 'video')),
  service_duration INTEGER, -- in minutes for calls
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT CHECK (payment_method IN ('stripe', 'western_union')),
  payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  stripe_payment_id TEXT,
  stripe_checkout_session_id TEXT,
  western_union_mtcn TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  -- When reading will be delivered or call will happen
  delivery_date TIMESTAMP WITH TIME ZONE,
  -- Actual delivery timestamp
  google_calendar_event_id TEXT,
  google_meet_link TEXT,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  language TEXT CHECK (language IN ('ar', 'en')),
  customer_notes TEXT,
  admin_notes TEXT,
  booking_started_at TIMESTAMP WITH TIME ZONE,
  booking_completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(phone);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled ON bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_service ON bookings(service_id);

-- Trigger
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 4️⃣ ANALYTICS EVENTS TABLE
-- ==========================================
-- Track every user action for funnel analysis
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  -- language_selected, service_viewed, service_selected, name_entered,
  -- email_entered, payment_initiated, payment_completed, booking_completed, etc.
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  phone TEXT,
  service_id INTEGER,
  service_name TEXT,
  amount DECIMAL(10,2),
  language TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Additional event-specific data
  session_id TEXT,
  -- Group events by session
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_customer ON analytics_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_events_session ON analytics_events(session_id);

-- ==========================================
-- 5️⃣ SERVICE PERFORMANCE TABLE
-- ==========================================
-- Daily aggregated service stats
CREATE TABLE IF NOT EXISTS service_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id INTEGER NOT NULL,
  service_name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER DEFAULT 0,
  selections INTEGER DEFAULT 0,
  bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0.00,
  conversion_rate DECIMAL(5,2) DEFAULT 0.00,
  -- Percentage: bookings / views * 100
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint: one row per service per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_perf_unique
  ON service_performance(service_id, date);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_perf_date ON service_performance(date DESC);
CREATE INDEX IF NOT EXISTS idx_service_perf_revenue ON service_performance(revenue DESC);

-- Trigger
CREATE TRIGGER service_performance_updated_at
  BEFORE UPDATE ON service_performance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 6️⃣ WEBHOOK LOGS TABLE
-- ==========================================
-- Debug webhook issues
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT CHECK (provider IN ('meta', 'twilio', 'stripe')),
  event_type TEXT,
  payload JSONB,
  headers JSONB,
  response_status INTEGER,
  response_body TEXT,
  processed BOOLEAN DEFAULT false,
  error TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_provider ON webhook_logs(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_processed ON webhook_logs(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_created ON webhook_logs(created_at DESC);

-- ==========================================
-- 7️⃣ ADMIN NOTIFICATIONS TABLE
-- ==========================================
-- Track all admin alerts
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_type TEXT NOT NULL,
  -- new_booking, payment_received, support_request, payment_failed, etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  related_booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  related_customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON admin_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON admin_notifications(created_at DESC);

-- ==========================================
-- 8️⃣ SYSTEM SETTINGS TABLE
-- ==========================================
-- Store system configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type TEXT CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger
CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description)
VALUES
  ('whatsapp_provider', 'meta', 'string', 'Active WhatsApp provider: meta or twilio'),
  ('admin_phone', '+9613620860', 'string', 'Admin phone number for notifications'),
  ('business_timezone', 'Asia/Beirut', 'string', 'Business timezone'),
  ('call_hours_start', '12', 'number', 'Call availability start hour (24h format)'),
  ('call_hours_end', '20', 'number', 'Call availability end hour (24h format)'),
  ('call_buffer_minutes', '30', 'number', 'Buffer time between calls'),
  ('auto_vip_threshold', '500', 'number', 'Total spent to become VIP customer')
ON CONFLICT (setting_key) DO NOTHING;

-- ==========================================
-- 🔧 HELPER FUNCTIONS
-- ==========================================

-- Function: Update customer stats after booking
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    UPDATE customers
    SET
      total_bookings = total_bookings + 1,
      total_spent = total_spent + NEW.amount,
      average_booking_value = (total_spent + NEW.amount) / (total_bookings + 1),
      last_booking_date = NEW.created_at,
      first_booking_date = COALESCE(first_booking_date, NEW.created_at),
      vip_status = (total_spent + NEW.amount) >= (
        SELECT setting_value::DECIMAL
        FROM system_settings
        WHERE setting_key = 'auto_vip_threshold'
      )
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_stats
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();

-- Function: Auto-expire old conversations
CREATE OR REPLACE FUNCTION auto_expire_conversations()
RETURNS void AS $$
BEGIN
  UPDATE conversations
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 📊 USEFUL VIEWS
-- ==========================================

-- View: Customer dashboard
CREATE OR REPLACE VIEW customer_dashboard AS
SELECT
  c.id,
  c.phone,
  c.name_english,
  c.name_arabic,
  c.email,
  c.preferred_language,
  c.total_bookings,
  c.total_spent,
  c.average_booking_value,
  c.vip_status,
  c.first_booking_date,
  c.last_booking_date,
  c.created_at,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'completed') as completed_bookings,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'pending') as pending_bookings,
  COUNT(DISTINCT b.id) FILTER (WHERE b.payment_status = 'pending') as pending_payments
FROM customers c
LEFT JOIN bookings b ON c.id = b.customer_id
GROUP BY c.id;

-- View: Today's bookings
CREATE OR REPLACE VIEW todays_bookings AS
SELECT
  b.*,
  c.name_english,
  c.name_arabic,
  c.vip_status
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
WHERE DATE(b.scheduled_date) = CURRENT_DATE
ORDER BY b.scheduled_date;

-- View: Revenue report
CREATE OR REPLACE VIEW revenue_report AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_bookings,
  COUNT(*) FILTER (WHERE payment_status = 'completed') as paid_bookings,
  SUM(amount) FILTER (WHERE payment_status = 'completed') as total_revenue,
  AVG(amount) FILTER (WHERE payment_status = 'completed') as avg_booking_value,
  COUNT(DISTINCT customer_id) as unique_customers
FROM bookings
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- View: Service popularity
CREATE OR REPLACE VIEW service_popularity AS
SELECT
  service_id,
  service_name,
  service_type,
  service_tier,
  COUNT(*) as total_bookings,
  COUNT(*) FILTER (WHERE payment_status = 'completed') as paid_bookings,
  SUM(amount) FILTER (WHERE payment_status = 'completed') as total_revenue,
  AVG(amount) as avg_price
FROM bookings
GROUP BY service_id, service_name, service_type, service_tier
ORDER BY total_bookings DESC;

-- ==========================================
-- ✅ VERIFICATION QUERIES
-- ==========================================

-- Run these to check everything works:

-- 1. Check tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 3. Check system settings
SELECT * FROM system_settings;

-- ==========================================
-- 📝 SAMPLE DATA (Optional - for testing)
-- ==========================================

-- Insert sample customer
INSERT INTO customers (phone, name_english, name_arabic, email, preferred_language)
VALUES ('+9611234567', 'Test Customer', 'عميل تجريبي', 'test@example.com', 'ar')
ON CONFLICT (phone) DO NOTHING;

-- ==========================================
-- 🎉 SCHEMA CREATION COMPLETE!
-- ==========================================
-- Tables created: 8
-- Indexes created: 30+
-- Functions created: 3
-- Views created: 4
-- Triggers created: 5
-- ==========================================
