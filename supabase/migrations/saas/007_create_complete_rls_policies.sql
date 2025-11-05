-- Migration 007: Complete Row-Level Security Policies
-- Ensures complete data isolation between businesses

-- Enable RLS on existing tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Customers: Business isolation
CREATE POLICY customers_business_isolation ON customers FOR ALL
  USING (business_id = current_setting('app.current_business_id', true)::UUID);

-- Conversations: Business isolation
CREATE POLICY conversations_business_isolation ON conversations FOR ALL
  USING (business_id = current_setting('app.current_business_id', true)::UUID);

-- Bookings: Business isolation
CREATE POLICY bookings_business_isolation ON bookings FOR ALL
  USING (business_id = current_setting('app.current_business_id', true)::UUID);

-- Services: Business isolation
CREATE POLICY services_business_isolation ON services FOR ALL
  USING (business_id = current_setting('app.current_business_id', true)::UUID);

-- Analytics: Business isolation
CREATE POLICY analytics_business_isolation ON analytics_events FOR ALL
  USING (business_id = current_setting('app.current_business_id', true)::UUID);

-- Webhook Logs: Business isolation
CREATE POLICY webhooks_business_isolation ON webhook_logs FOR ALL
  USING (business_id = current_setting('app.current_business_id', true)::UUID);

-- Notifications: Employee can see their notifications or business-wide
CREATE POLICY notifications_employee_access ON admin_notifications FOR ALL
  USING (
    business_id = current_setting('app.current_business_id', true)::UUID
    AND (
      employee_id = current_setting('app.current_employee_id', true)::UUID
      OR employee_id IS NULL
    )
  );

-- Helper function to set business context
CREATE OR REPLACE FUNCTION set_business_context(p_business_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_business_id', p_business_id::TEXT, false);
END;
$$ LANGUAGE plpgsql;

-- Helper function to set employee context
CREATE OR REPLACE FUNCTION set_employee_context(p_employee_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_employee_id', p_employee_id::TEXT, false);
END;
$$ LANGUAGE plpgsql;
