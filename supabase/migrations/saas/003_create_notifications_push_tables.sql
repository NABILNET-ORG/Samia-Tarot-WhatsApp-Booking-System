-- Migration 003: Notifications & Push Subscriptions

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE, -- NULL = all employees

  type TEXT NOT NULL CHECK (type IN ('new_message', 'new_booking', 'payment_received', 'support_request', 'conversation_assigned', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT, -- emoji

  action_url TEXT,
  action_label TEXT,

  related_conversation_id UUID REFERENCES conversations(id),
  related_booking_id UUID REFERENCES bookings(id),
  related_customer_id UUID REFERENCES customers(id),

  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,

  push_sent BOOLEAN DEFAULT false,
  push_sent_at TIMESTAMP,
  push_error TEXT,

  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  metadata_json JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
);

CREATE INDEX idx_notifications_employee_unread ON notifications(employee_id, is_read, created_at DESC) WHERE is_read = false;
CREATE INDEX idx_notifications_business ON notifications(business_id, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(business_id, type, created_at DESC);

-- Push Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,

  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  browser TEXT,
  os TEXT,
  device_name TEXT,

  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  error_count INT DEFAULT 0,
  last_error TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_push_subscriptions_employee ON push_subscriptions(employee_id) WHERE is_active = true;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_own_business ON notifications FOR ALL
  USING (business_id = current_setting('app.current_business_id', true)::UUID);

CREATE POLICY push_subscriptions_own_employee ON push_subscriptions FOR ALL
  USING (employee_id = current_setting('app.current_employee_id', true)::UUID);
