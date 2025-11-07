-- ================================================================
-- 012: Add Composite Indexes for Performance Optimization
-- ================================================================
-- This migration adds composite indexes to improve query performance
-- for common access patterns in the application
-- ================================================================

-- ================================================================
-- CONVERSATIONS TABLE INDEXES
-- ================================================================

-- Index for fetching conversations by business and timestamp
CREATE INDEX IF NOT EXISTS idx_conversations_business_created
ON conversations(business_id, created_at DESC);

-- Index for fetching conversations by business and status
CREATE INDEX IF NOT EXISTS idx_conversations_business_status
ON conversations(business_id, status, created_at DESC);

-- Index for fetching conversations by business and customer
CREATE INDEX IF NOT EXISTS idx_conversations_business_customer
ON conversations(business_id, customer_id, created_at DESC);

-- Index for takeover functionality
CREATE INDEX IF NOT EXISTS idx_conversations_business_takeover
ON conversations(business_id, is_taken_over, taken_over_at DESC)
WHERE is_taken_over = true;

-- ================================================================
-- MESSAGES TABLE INDEXES
-- ================================================================

-- Index for fetching messages by conversation (most common query)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
ON messages(conversation_id, created_at ASC);

-- Index for fetching messages by business
CREATE INDEX IF NOT EXISTS idx_messages_business_created
ON messages(business_id, created_at DESC);

-- Index for voice messages
CREATE INDEX IF NOT EXISTS idx_messages_business_voice
ON messages(business_id, media_type, created_at DESC)
WHERE media_type = 'voice';

-- Index for messages by direction (inbound/outbound)
CREATE INDEX IF NOT EXISTS idx_messages_business_direction
ON messages(business_id, direction, created_at DESC);

-- ================================================================
-- CUSTOMERS TABLE INDEXES
-- ================================================================

-- Index for fetching customers by business and name
CREATE INDEX IF NOT EXISTS idx_customers_business_name
ON customers(business_id, name);

-- Index for fetching customers by business and phone
CREATE INDEX IF NOT EXISTS idx_customers_business_phone
ON customers(business_id, phone_number);

-- Index for fetching customers by business and timestamp
CREATE INDEX IF NOT EXISTS idx_customers_business_created
ON customers(business_id, created_at DESC);

-- ================================================================
-- BOOKINGS TABLE INDEXES
-- ================================================================

-- Index for fetching bookings by business and date
CREATE INDEX IF NOT EXISTS idx_bookings_business_date
ON bookings(business_id, booking_date DESC);

-- Index for fetching bookings by business and status
CREATE INDEX IF NOT EXISTS idx_bookings_business_status
ON bookings(business_id, status, booking_date DESC);

-- Index for fetching bookings by customer
CREATE INDEX IF NOT EXISTS idx_bookings_business_customer
ON bookings(business_id, customer_id, booking_date DESC);

-- Index for fetching bookings by service
CREATE INDEX IF NOT EXISTS idx_bookings_business_service
ON bookings(business_id, service_id, booking_date DESC);

-- ================================================================
-- EMPLOYEES TABLE INDEXES
-- ================================================================

-- Index for employee login (email lookup)
CREATE INDEX IF NOT EXISTS idx_employees_email
ON employees(email) WHERE is_active = true;

-- Index for fetching employees by business
CREATE INDEX IF NOT EXISTS idx_employees_business_active
ON employees(business_id, is_active, created_at DESC);

-- ================================================================
-- ACTIVITY LOGS TABLE INDEXES
-- ================================================================

-- Index for fetching activity logs by business and timestamp
CREATE INDEX IF NOT EXISTS idx_activity_logs_business_created
ON activity_logs(business_id, created_at DESC);

-- Index for fetching activity logs by action
CREATE INDEX IF NOT EXISTS idx_activity_logs_business_action
ON activity_logs(business_id, action, created_at DESC);

-- Index for fetching activity logs by employee
CREATE INDEX IF NOT EXISTS idx_activity_logs_business_employee
ON activity_logs(business_id, employee_id, created_at DESC);

-- ================================================================
-- WEBHOOK LOGS TABLE INDEXES
-- ================================================================

-- Index for fetching webhook logs by business and timestamp
CREATE INDEX IF NOT EXISTS idx_webhook_logs_business_created
ON webhook_logs(business_id, created_at DESC);

-- Index for fetching webhook logs by status
CREATE INDEX IF NOT EXISTS idx_webhook_logs_business_status
ON webhook_logs(business_id, status, created_at DESC);

-- Index for fetching webhook logs by source
CREATE INDEX IF NOT EXISTS idx_webhook_logs_business_source
ON webhook_logs(business_id, source, created_at DESC);

-- ================================================================
-- SUBSCRIPTIONS TABLE INDEXES
-- ================================================================

-- Index for fetching active subscriptions by business
CREATE INDEX IF NOT EXISTS idx_subscriptions_business_status
ON subscriptions(business_id, status) WHERE status = 'active';

-- ================================================================
-- SERVICES TABLE INDEXES
-- ================================================================

-- Index for fetching active services by business
CREATE INDEX IF NOT EXISTS idx_services_business_active
ON services(business_id, is_active) WHERE is_active = true;

-- ================================================================
-- SESSION INDEXES
-- ================================================================

-- Index for active session lookup
CREATE INDEX IF NOT EXISTS idx_active_sessions_employee
ON active_sessions(employee_id, expires_at) WHERE expires_at > NOW();

-- Index for session cleanup
CREATE INDEX IF NOT EXISTS idx_active_sessions_expires
ON active_sessions(expires_at) WHERE expires_at <= NOW();

-- ================================================================
-- PASSWORD RESET TOKENS INDEXES
-- ================================================================

-- Index for token lookup
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token
ON password_reset_tokens(token) WHERE used_at IS NULL AND expires_at > NOW();

-- ================================================================
-- NOTIFICATIONS TABLE INDEXES
-- ================================================================

-- Index for fetching notifications by employee
CREATE INDEX IF NOT EXISTS idx_notifications_employee_created
ON notifications(employee_id, created_at DESC);

-- Index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_employee_unread
ON notifications(employee_id, is_read, created_at DESC) WHERE is_read = false;

-- ================================================================
-- VERIFICATION
-- ================================================================

-- Verify indexes were created successfully
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';

    RAISE NOTICE 'Total composite indexes created: %', index_count;
END $$;

COMMENT ON SCHEMA public IS 'Composite indexes added for performance optimization - Migration 012';
