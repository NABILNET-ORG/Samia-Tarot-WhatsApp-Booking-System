-- ==========================================
-- 🚀 COMPLETE SUPABASE SETUP - EXECUTE THIS!
-- ==========================================
-- Run this entire file in Supabase SQL Editor
-- OR connect via: postgresql://postgres.lovvgshqnqqlzbiviate:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 🗑️ CLEAN UP (if re-running)
-- ==========================================
DROP TABLE IF EXISTS service_price_history CASCADE;
DROP TABLE IF EXISTS admin_notifications CASCADE;
DROP TABLE IF EXISTS webhook_logs CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS service_performance CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS update_customer_stats CASCADE;
DROP FUNCTION IF EXISTS auto_expire_conversations CASCADE;
DROP FUNCTION IF EXISTS track_service_price_change CASCADE;

-- ==========================================
-- 1️⃣ CUSTOMERS TABLE
-- ==========================================
CREATE TABLE customers (
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

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_vip ON customers(vip_status);
CREATE INDEX idx_customers_created ON customers(created_at DESC);

-- ==========================================
-- 2️⃣ SERVICES TABLE ⭐ NEW!
-- ==========================================
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  service_key TEXT UNIQUE NOT NULL,
  name_arabic TEXT NOT NULL,
  name_english TEXT NOT NULL,
  description_arabic TEXT,
  description_english TEXT,
  short_desc_arabic TEXT,
  short_desc_english TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2), -- For showing discounts
  currency TEXT DEFAULT 'USD',
  service_type TEXT CHECK (service_type IN ('reading', 'call', 'support')) NOT NULL,
  service_tier TEXT CHECK (service_tier IN ('standard', 'premium', 'golden', 'video')) NOT NULL,
  duration_minutes INTEGER, -- For call services
  delivery_days INTEGER DEFAULT 0, -- Days until delivery
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 100,
  max_daily_bookings INTEGER,
  stock_available INTEGER,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  image_url TEXT,
  icon_emoji TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_services_active ON services(is_active) WHERE is_active = true;
CREATE INDEX idx_services_featured ON services(is_featured) WHERE is_featured = true;
CREATE INDEX idx_services_type ON services(service_type);
CREATE INDEX idx_services_tier ON services(service_tier);
CREATE INDEX idx_services_sort ON services(sort_order, id);

-- ==========================================
-- 3️⃣ CONVERSATIONS TABLE
-- ==========================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  current_state TEXT NOT NULL DEFAULT 'GREETING',
  selected_service INTEGER REFERENCES services(id),
  service_name TEXT,
  full_name TEXT,
  email TEXT,
  language TEXT CHECK (language IN ('ar', 'en')) DEFAULT 'ar',
  message_history JSONB DEFAULT '[]'::jsonb,
  context_data JSONB DEFAULT '{}'::jsonb,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conversations_phone ON conversations(phone);
CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_conversations_active ON conversations(is_active) WHERE is_active = true;
CREATE INDEX idx_conversations_expires ON conversations(expires_at);
CREATE INDEX idx_conversations_state ON conversations(current_state);

-- ==========================================
-- 4️⃣ BOOKINGS TABLE
-- ==========================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  service_id INTEGER REFERENCES services(id),
  service_name TEXT NOT NULL,
  service_type TEXT CHECK (service_type IN ('reading', 'call', 'support')),
  service_tier TEXT CHECK (service_tier IN ('standard', 'premium', 'golden', 'video')),
  service_duration INTEGER,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT CHECK (payment_method IN ('stripe', 'western_union')),
  payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  stripe_payment_id TEXT,
  stripe_checkout_session_id TEXT,
  western_union_mtcn TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  delivery_date TIMESTAMP WITH TIME ZONE,
  google_calendar_event_id TEXT,
  google_meet_link TEXT,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  language TEXT CHECK (language IN ('ar', 'en')),
  customer_notes TEXT,
  admin_notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  booking_started_at TIMESTAMP WITH TIME ZONE,
  booking_completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bookings_phone ON bookings(phone);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_service ON bookings(service_id);
CREATE INDEX idx_bookings_scheduled ON bookings(scheduled_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX idx_bookings_created ON bookings(created_at DESC);

-- ==========================================
-- 5️⃣ ANALYTICS EVENTS TABLE
-- ==========================================
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  phone TEXT,
  service_id INTEGER REFERENCES services(id),
  service_name TEXT,
  amount DECIMAL(10,2),
  language TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_type ON analytics_events(event_type);
CREATE INDEX idx_events_created ON analytics_events(created_at DESC);
CREATE INDEX idx_events_customer ON analytics_events(customer_id);
CREATE INDEX idx_events_service ON analytics_events(service_id);
CREATE INDEX idx_events_session ON analytics_events(session_id);

-- ==========================================
-- 6️⃣ SERVICE PERFORMANCE TABLE
-- ==========================================
CREATE TABLE service_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id INTEGER REFERENCES services(id) NOT NULL,
  service_name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER DEFAULT 0,
  selections INTEGER DEFAULT 0,
  bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0.00,
  conversion_rate DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_service_perf_unique ON service_performance(service_id, date);
CREATE INDEX idx_service_perf_date ON service_performance(date DESC);
CREATE INDEX idx_service_perf_revenue ON service_performance(revenue DESC);

-- ==========================================
-- 7️⃣ WEBHOOK LOGS TABLE
-- ==========================================
CREATE TABLE webhook_logs (
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

CREATE INDEX idx_webhook_provider ON webhook_logs(provider);
CREATE INDEX idx_webhook_processed ON webhook_logs(processed);
CREATE INDEX idx_webhook_created ON webhook_logs(created_at DESC);

-- ==========================================
-- 8️⃣ ADMIN NOTIFICATIONS TABLE
-- ==========================================
CREATE TABLE admin_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_type TEXT NOT NULL,
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

CREATE INDEX idx_notifications_read ON admin_notifications(is_read);
CREATE INDEX idx_notifications_priority ON admin_notifications(priority);
CREATE INDEX idx_notifications_created ON admin_notifications(created_at DESC);

-- ==========================================
-- 9️⃣ SYSTEM SETTINGS TABLE
-- ==========================================
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type TEXT CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 🔟 SERVICE PRICE HISTORY TABLE ⭐ NEW!
-- ==========================================
CREATE TABLE service_price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
  service_key TEXT NOT NULL,
  old_price DECIMAL(10,2) NOT NULL,
  new_price DECIMAL(10,2) NOT NULL,
  changed_by TEXT,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_price_history_service ON service_price_history(service_id);
CREATE INDEX idx_price_history_created ON service_price_history(created_at DESC);

-- ==========================================
-- 🔧 TRIGGERS & FUNCTIONS
-- ==========================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: customers updated_at
CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: services updated_at
CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: conversations updated_at
CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: bookings updated_at
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: service_performance updated_at
CREATE TRIGGER service_performance_updated_at
  BEFORE UPDATE ON service_performance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: system_settings updated_at
CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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
      vip_status = (total_spent + NEW.amount) >= 500
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_stats
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();

-- Function: Track service price changes
CREATE OR REPLACE FUNCTION track_service_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.price != NEW.price THEN
    INSERT INTO service_price_history (service_id, service_key, old_price, new_price, reason)
    VALUES (NEW.id, NEW.service_key, OLD.price, NEW.price, 'Price updated');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_price_change
  AFTER UPDATE ON services
  FOR EACH ROW
  WHEN (OLD.price IS DISTINCT FROM NEW.price)
  EXECUTE FUNCTION track_service_price_change();

-- ==========================================
-- 📊 USEFUL VIEWS
-- ==========================================

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
  COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'pending') as pending_bookings
FROM customers c
LEFT JOIN bookings b ON c.id = b.customer_id
GROUP BY c.id;

CREATE OR REPLACE VIEW todays_bookings AS
SELECT
  b.*,
  c.name_english,
  c.name_arabic,
  c.vip_status,
  s.name_english as service_display_name
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
LEFT JOIN services s ON b.service_id = s.id
WHERE DATE(b.scheduled_date) = CURRENT_DATE
ORDER BY b.scheduled_date;

CREATE OR REPLACE VIEW service_popularity AS
SELECT
  s.id,
  s.service_key,
  s.name_english,
  s.name_arabic,
  s.price,
  s.service_type,
  s.service_tier,
  s.is_active,
  COUNT(b.id) as total_bookings,
  COUNT(b.id) FILTER (WHERE b.payment_status = 'completed') as paid_bookings,
  SUM(b.amount) FILTER (WHERE b.payment_status = 'completed') as total_revenue,
  AVG(b.rating) as avg_rating
FROM services s
LEFT JOIN bookings b ON s.id = b.service_id
GROUP BY s.id
ORDER BY total_bookings DESC;

-- ==========================================
-- 💾 INSERT INITIAL DATA
-- ==========================================

-- System settings
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
-- ⭐ INSERT ALL 13 SERVICES!
-- ==========================================

INSERT INTO services (
  service_key, name_arabic, name_english,
  description_arabic, description_english,
  short_desc_arabic, short_desc_english,
  price, service_type, service_tier,
  delivery_days, sort_order, is_active, icon_emoji
) VALUES
-- COFFEE CUP READINGS
(
  'standard_coffee_cup',
  'قراءة الفنجان العادية',
  'Standard Coffee Cup Reading',
  'قراءة تقليدية للفنجان تكشف عن مستقبلك القريب',
  'Traditional coffee cup reading revealing your near future',
  'قراءة سريعة ودقيقة',
  'Quick and accurate reading',
  50.00, 'reading', 'standard',
  2, 1, true, '☕'
),
(
  'premium_coffee_cup',
  'قراءة الفنجان المميزة',
  'Premium Coffee Cup Reading',
  'قراءة مفصلة للفنجان مع تحليل عميق لحياتك',
  'Detailed coffee cup reading with deep life analysis',
  'تحليل مفصل وشامل',
  'Detailed comprehensive analysis',
  100.00, 'reading', 'premium',
  1, 2, true, '☕✨'
),
(
  'golden_coffee_cup',
  'قراءة الفنجان الذهبية',
  'Golden Coffee Cup Reading',
  'أفضل قراءة فنجان مع تفسير كامل ومتابعة شخصية',
  'Best coffee cup reading with full interpretation and personal follow-up',
  'قراءة حصرية مع متابعة',
  'Exclusive reading with follow-up',
  200.00, 'reading', 'golden',
  0, 3, true, '☕👑'
),

-- TAROT READINGS
(
  'standard_tarot',
  'قراءة التاروت العادية',
  'Standard Tarot Reading',
  'قراءة تاروت أساسية للإجابة على أسئلتك',
  'Basic tarot reading to answer your questions',
  'إجابات واضحة ومباشرة',
  'Clear and direct answers',
  50.00, 'reading', 'standard',
  2, 4, true, '🃏'
),
(
  'premium_tarot',
  'قراءة التاروت المميزة',
  'Premium Tarot Reading',
  'قراءة تاروت متقدمة مع توزيع 10 بطاقات',
  'Advanced tarot reading with 10-card spread',
  'رؤى عميقة لقراراتك',
  'Deep insights for your decisions',
  100.00, 'reading', 'premium',
  1, 5, true, '🃏✨'
),
(
  'golden_tarot',
  'قراءة التاروت الذهبية',
  'Golden Tarot Reading',
  'قراءة تاروت شاملة مع توزيع 15 بطاقة وتقرير مفصل',
  'Comprehensive tarot reading with 15-card spread and detailed report',
  'القراءة الأكثر شمولاً',
  'Most comprehensive reading',
  200.00, 'reading', 'golden',
  0, 6, true, '🃏👑'
),

-- RUNE READINGS
(
  'standard_rune',
  'قراءة الرون العادية',
  'Standard Rune Reading',
  'قراءة رونية تقليدية للتوجيه الروحي',
  'Traditional rune reading for spiritual guidance',
  'حكمة قديمة لطريقك',
  'Ancient wisdom for your path',
  50.00, 'reading', 'standard',
  2, 7, true, '🗿'
),
(
  'premium_rune',
  'قراءة الرون المميزة',
  'Premium Rune Reading',
  'قراءة رونية متقدمة مع تفسير عميق',
  'Advanced rune reading with deep interpretation',
  'رؤى روحانية عميقة',
  'Deep spiritual insights',
  100.00, 'reading', 'premium',
  1, 8, true, '🗿✨'
),
(
  'golden_rune',
  'قراءة الرون الذهبية',
  'Golden Rune Reading',
  'قراءة رونية شاملة مع استشارة روحانية',
  'Comprehensive rune reading with spiritual consultation',
  'استشارة روحانية كاملة',
  'Complete spiritual consultation',
  200.00, 'reading', 'golden',
  0, 9, true, '🗿👑'
),

-- VIDEO CALL SERVICES
(
  'direct_call_30',
  'اتصال مباشر (30 دقيقة)',
  'Direct Call (30 min)',
  'اتصال فيديو مباشر مع سامية لمدة 30 دقيقة',
  'Direct video call with Samia for 30 minutes',
  'جلسة خاصة ومباشرة',
  'Private direct session',
  150.00, 'call', 'video',
  0, 10, true, '📞'
),
(
  'premium_call_45',
  'اتصال مميز (45 دقيقة)',
  'Premium Call (45 min)',
  'جلسة فيديو موسعة لمدة 45 دقيقة مع قراءة مباشرة',
  'Extended 45-minute video session with live reading',
  'وقت أطول لأسئلتك',
  'More time for your questions',
  200.00, 'call', 'video',
  0, 11, true, '📞✨'
),
(
  'golden_call_60',
  'اتصال ذهبي (60 دقيقة)',
  'Golden Call (60 min)',
  'جلسة حصرية لمدة ساعة كاملة مع قراءة شاملة',
  'Exclusive full hour session with comprehensive reading',
  'الجلسة الأكثر شمولاً',
  'Most comprehensive session',
  250.00, 'call', 'video',
  0, 12, true, '📞👑'
),

-- SUPPORT
(
  'support_request',
  'طلب دعم',
  'Support Request',
  'تواصل مع فريق الدعم للمساعدة',
  'Contact support team for assistance',
  'نحن هنا للمساعدة',
  'We are here to help',
  0.00, 'support', 'standard',
  0, 99, true, '🆘'
);

-- ==========================================
-- ✅ VERIFICATION
-- ==========================================

-- Count tables
SELECT
  'Tables Created' as check_type,
  COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public';

-- Count services
SELECT
  'Services Inserted' as check_type,
  COUNT(*) as count
FROM services;

-- Show all services
SELECT
  id,
  service_key,
  name_english,
  price,
  service_type,
  is_active
FROM services
ORDER BY sort_order;

-- ==========================================
-- 🎉 SETUP COMPLETE!
-- ==========================================
-- ✅ 10 tables created
-- ✅ 13 services inserted
-- ✅ Triggers activated
-- ✅ Views created
-- ✅ Ready to use!
-- ==========================================
