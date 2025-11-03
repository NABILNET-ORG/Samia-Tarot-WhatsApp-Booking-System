-- ==========================================
-- 📊 ANALYTICS QUERIES FOR SAMIA TAROT
-- ==========================================
-- Copy these queries into Supabase SQL Editor
-- Or use in your dashboard
-- ==========================================

-- ==========================================
-- 💰 REVENUE & BOOKINGS
-- ==========================================

-- 1️⃣ Today's Revenue
SELECT
  COUNT(*) as total_bookings,
  COUNT(*) FILTER (WHERE payment_status = 'completed') as paid_bookings,
  SUM(amount) FILTER (WHERE payment_status = 'completed') as total_revenue,
  AVG(amount) FILTER (WHERE payment_status = 'completed') as avg_booking_value
FROM bookings
WHERE DATE(created_at) = CURRENT_DATE;

-- 2️⃣ This Week's Revenue
SELECT
  COUNT(*) as total_bookings,
  SUM(amount) FILTER (WHERE payment_status = 'completed') as total_revenue
FROM bookings
WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE);

-- 3️⃣ This Month's Revenue
SELECT
  COUNT(*) as total_bookings,
  SUM(amount) FILTER (WHERE payment_status = 'completed') as total_revenue
FROM bookings
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE);

-- 4️⃣ Revenue Trend (Last 30 Days)
SELECT
  DATE(created_at) as date,
  COUNT(*) as bookings,
  SUM(amount) FILTER (WHERE payment_status = 'completed') as revenue
FROM bookings
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 5️⃣ Revenue by Payment Method
SELECT
  payment_method,
  COUNT(*) as bookings,
  SUM(amount) FILTER (WHERE payment_status = 'completed') as revenue,
  AVG(amount) as avg_value
FROM bookings
WHERE payment_status = 'completed'
GROUP BY payment_method;

-- ==========================================
-- 🎯 SERVICE PERFORMANCE
-- ==========================================

-- 6️⃣ Most Popular Services
SELECT
  service_id,
  service_name,
  service_tier,
  COUNT(*) as total_bookings,
  SUM(amount) FILTER (WHERE payment_status = 'completed') as total_revenue,
  AVG(amount) as avg_price
FROM bookings
GROUP BY service_id, service_name, service_tier
ORDER BY total_bookings DESC;

-- 7️⃣ Service Revenue Ranking
SELECT
  service_name,
  SUM(amount) FILTER (WHERE payment_status = 'completed') as revenue,
  COUNT(*) as bookings
FROM bookings
WHERE payment_status = 'completed'
GROUP BY service_name
ORDER BY revenue DESC;

-- 8️⃣ Conversion Rate by Service
SELECT
  s.service_name,
  COUNT(DISTINCT ae.phone) FILTER (WHERE ae.event_type = 'service_selected') as selections,
  COUNT(DISTINCT b.id) FILTER (WHERE b.payment_status = 'completed') as bookings,
  ROUND(
    100.0 * COUNT(DISTINCT b.id) FILTER (WHERE b.payment_status = 'completed') /
    NULLIF(COUNT(DISTINCT ae.phone) FILTER (WHERE ae.event_type = 'service_selected'), 0),
    2
  ) as conversion_rate
FROM (SELECT DISTINCT service_name FROM bookings) s
LEFT JOIN analytics_events ae ON ae.service_name = s.service_name
LEFT JOIN bookings b ON b.service_name = s.service_name
GROUP BY s.service_name
ORDER BY conversion_rate DESC;

-- ==========================================
-- 👥 CUSTOMER INSIGHTS
-- ==========================================

-- 9️⃣ Customer Stats
SELECT
  COUNT(*) as total_customers,
  COUNT(*) FILTER (WHERE total_bookings > 0) as active_customers,
  COUNT(*) FILTER (WHERE total_bookings >= 2) as repeat_customers,
  COUNT(*) FILTER (WHERE vip_status = true) as vip_customers,
  ROUND(AVG(total_spent), 2) as avg_customer_value
FROM customers;

-- 🔟 Top 10 Customers (VIPs)
SELECT
  name_english,
  name_arabic,
  phone,
  total_bookings,
  total_spent,
  vip_status,
  last_booking_date
FROM customers
WHERE total_bookings > 0
ORDER BY total_spent DESC
LIMIT 10;

-- 1️⃣1️⃣ New Customers (Last 7 Days)
SELECT
  DATE(created_at) as date,
  COUNT(*) as new_customers
FROM customers
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 1️⃣2️⃣ Customer Retention (Repeat Rate)
SELECT
  COUNT(*) FILTER (WHERE total_bookings = 1) as one_time_customers,
  COUNT(*) FILTER (WHERE total_bookings >= 2) as repeat_customers,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE total_bookings >= 2) /
    NULLIF(COUNT(*), 0),
    2
  ) as repeat_rate
FROM customers
WHERE total_bookings > 0;

-- 1️⃣3️⃣ Inactive Customers (No booking in 30+ days)
SELECT
  name_english,
  phone,
  last_booking_date,
  total_bookings,
  total_spent,
  CURRENT_DATE - DATE(last_booking_date) as days_since_last_booking
FROM customers
WHERE last_booking_date < CURRENT_DATE - INTERVAL '30 days'
  AND total_bookings >= 2
ORDER BY total_spent DESC
LIMIT 20;

-- ==========================================
-- 🚀 CONVERSION FUNNEL
-- ==========================================

-- 1️⃣4️⃣ Complete Funnel Analysis
WITH funnel AS (
  SELECT
    COUNT(DISTINCT phone) FILTER (WHERE event_type = 'message_received') as total_contacts,
    COUNT(DISTINCT phone) FILTER (WHERE event_type = 'language_selected') as language_selected,
    COUNT(DISTINCT phone) FILTER (WHERE event_type = 'service_menu_viewed') as menu_viewed,
    COUNT(DISTINCT phone) FILTER (WHERE event_type = 'service_selected') as service_selected,
    COUNT(DISTINCT phone) FILTER (WHERE event_type = 'payment_initiated') as payment_initiated,
    COUNT(DISTINCT customer_id) FILTER (WHERE event_type = 'payment_completed') as payment_completed
  FROM analytics_events
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
)
SELECT
  'Total Contacts' as step, total_contacts as count, 100.0 as percentage FROM funnel
UNION ALL
SELECT 'Language Selected', language_selected, ROUND(100.0 * language_selected / NULLIF(total_contacts, 0), 2) FROM funnel
UNION ALL
SELECT 'Menu Viewed', menu_viewed, ROUND(100.0 * menu_viewed / NULLIF(total_contacts, 0), 2) FROM funnel
UNION ALL
SELECT 'Service Selected', service_selected, ROUND(100.0 * service_selected / NULLIF(total_contacts, 0), 2) FROM funnel
UNION ALL
SELECT 'Payment Initiated', payment_initiated, ROUND(100.0 * payment_initiated / NULLIF(total_contacts, 0), 2) FROM funnel
UNION ALL
SELECT 'Payment Completed', payment_completed, ROUND(100.0 * payment_completed / NULLIF(total_contacts, 0), 2) FROM funnel;

-- ==========================================
-- 📅 TODAY'S SCHEDULE
-- ==========================================

-- 1️⃣5️⃣ Today's Bookings (Schedule View)
SELECT
  TO_CHAR(scheduled_date, 'HH12:MI AM') as time,
  service_name,
  c.name_english,
  c.name_arabic,
  c.phone,
  c.vip_status,
  b.status,
  b.google_meet_link
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
WHERE DATE(b.scheduled_date) = CURRENT_DATE
ORDER BY b.scheduled_date;

-- 1️⃣6️⃣ This Week's Schedule
SELECT
  DATE(scheduled_date) as date,
  TO_CHAR(scheduled_date, 'Dy') as day_of_week,
  COUNT(*) as bookings,
  STRING_AGG(service_name, ', ') as services
FROM bookings
WHERE scheduled_date >= DATE_TRUNC('week', CURRENT_DATE)
  AND scheduled_date < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
GROUP BY DATE(scheduled_date), TO_CHAR(scheduled_date, 'Dy')
ORDER BY date;

-- ==========================================
-- 🌍 LANGUAGE & REGION
-- ==========================================

-- 1️⃣7️⃣ Language Preference
SELECT
  preferred_language,
  COUNT(*) as customers,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM customers
GROUP BY preferred_language;

-- 1️⃣8️⃣ Bookings by Language
SELECT
  language,
  COUNT(*) as bookings,
  SUM(amount) FILTER (WHERE payment_status = 'completed') as revenue
FROM bookings
GROUP BY language;

-- 1️⃣9️⃣ Country Distribution
SELECT
  country_code,
  COUNT(*) as customers,
  SUM(total_spent) as total_revenue
FROM customers
WHERE country_code IS NOT NULL
GROUP BY country_code
ORDER BY customers DESC;

-- ==========================================
-- ⏱️ PERFORMANCE METRICS
-- ==========================================

-- 2️⃣0️⃣ Average Time to Book
SELECT
  AVG(booking_completed_at - booking_started_at) as avg_booking_time,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY booking_completed_at - booking_started_at) as median_booking_time
FROM bookings
WHERE booking_completed_at IS NOT NULL
  AND booking_started_at IS NOT NULL;

-- 2️⃣1️⃣ Response Time (Webhook Processing)
SELECT
  AVG(processing_time_ms) as avg_ms,
  MAX(processing_time_ms) as max_ms,
  MIN(processing_time_ms) as min_ms
FROM webhook_logs
WHERE processing_time_ms IS NOT NULL
  AND created_at >= CURRENT_DATE - INTERVAL '7 days';

-- ==========================================
-- 🔔 ADMIN NOTIFICATIONS
-- ==========================================

-- 2️⃣2️⃣ Unread Notifications
SELECT
  notification_type,
  COUNT(*) as count
FROM admin_notifications
WHERE is_read = false
GROUP BY notification_type
ORDER BY count DESC;

-- 2️⃣3️⃣ Recent Notifications (Last 24 Hours)
SELECT
  notification_type,
  title,
  message,
  priority,
  created_at
FROM admin_notifications
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY
  CASE priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  created_at DESC
LIMIT 10;

-- ==========================================
-- 📈 GROWTH METRICS
-- ==========================================

-- 2️⃣4️⃣ Week-over-Week Growth
WITH this_week AS (
  SELECT
    COUNT(*) as bookings,
    SUM(amount) FILTER (WHERE payment_status = 'completed') as revenue
  FROM bookings
  WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)
),
last_week AS (
  SELECT
    COUNT(*) as bookings,
    SUM(amount) FILTER (WHERE payment_status = 'completed') as revenue
  FROM bookings
  WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 days'
    AND created_at < DATE_TRUNC('week', CURRENT_DATE)
)
SELECT
  tw.bookings as this_week_bookings,
  lw.bookings as last_week_bookings,
  ROUND(100.0 * (tw.bookings - lw.bookings) / NULLIF(lw.bookings, 0), 2) as booking_growth_pct,
  tw.revenue as this_week_revenue,
  lw.revenue as last_week_revenue,
  ROUND(100.0 * (tw.revenue - lw.revenue) / NULLIF(lw.revenue, 0), 2) as revenue_growth_pct
FROM this_week tw, last_week lw;

-- 2️⃣5️⃣ Monthly Revenue Comparison
SELECT
  TO_CHAR(created_at, 'YYYY-MM') as month,
  COUNT(*) as bookings,
  SUM(amount) FILTER (WHERE payment_status = 'completed') as revenue
FROM bookings
WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY month DESC;

-- ==========================================
-- 🎯 BUSINESS INTELLIGENCE
-- ==========================================

-- 2️⃣6️⃣ Best Day of Week for Bookings
SELECT
  TO_CHAR(created_at, 'Day') as day_of_week,
  COUNT(*) as bookings,
  SUM(amount) FILTER (WHERE payment_status = 'completed') as revenue,
  AVG(amount) as avg_value
FROM bookings
GROUP BY TO_CHAR(created_at, 'Day'), EXTRACT(DOW FROM created_at)
ORDER BY EXTRACT(DOW FROM created_at);

-- 2️⃣7️⃣ Best Hour of Day for Bookings
SELECT
  EXTRACT(HOUR FROM created_at) as hour,
  COUNT(*) as bookings
FROM bookings
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour;

-- 2️⃣8️⃣ Customer Lifetime Value Segments
SELECT
  CASE
    WHEN total_spent >= 500 THEN '👑 VIP ($500+)'
    WHEN total_spent >= 200 THEN '⭐ Loyal ($200-$499)'
    WHEN total_spent >= 100 THEN '✅ Regular ($100-$199)'
    ELSE '🆕 New (<$100)'
  END as segment,
  COUNT(*) as customers,
  ROUND(AVG(total_spent), 2) as avg_spent,
  SUM(total_spent) as total_revenue
FROM customers
WHERE total_bookings > 0
GROUP BY segment
ORDER BY avg_spent DESC;

-- ==========================================
-- 🔧 SYSTEM HEALTH
-- ==========================================

-- 2️⃣9️⃣ Webhook Success Rate
SELECT
  provider,
  COUNT(*) as total_webhooks,
  COUNT(*) FILTER (WHERE processed = true) as successful,
  COUNT(*) FILTER (WHERE error IS NOT NULL) as failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE processed = true) / NULLIF(COUNT(*), 0), 2) as success_rate
FROM webhook_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY provider;

-- 3️⃣0️⃣ Active Conversations
SELECT
  COUNT(*) FILTER (WHERE is_active = true) as active_conversations,
  COUNT(*) FILTER (WHERE is_active = false) as expired_conversations,
  COUNT(*) FILTER (WHERE last_message_at >= NOW() - INTERVAL '1 hour') as conversations_last_hour
FROM conversations;

-- ==========================================
-- 📊 EXPORT FOR EXTERNAL TOOLS
-- ==========================================

-- 3️⃣1️⃣ Customer Export (CSV-ready)
SELECT
  phone,
  name_english,
  email,
  preferred_language,
  total_bookings,
  total_spent,
  vip_status,
  TO_CHAR(last_booking_date, 'YYYY-MM-DD') as last_booking
FROM customers
WHERE total_bookings > 0
ORDER BY total_spent DESC;

-- 3️⃣2️⃣ Bookings Export (CSV-ready)
SELECT
  TO_CHAR(b.created_at, 'YYYY-MM-DD HH24:MI:SS') as booking_date,
  c.name_english,
  c.phone,
  b.service_name,
  b.amount,
  b.payment_method,
  b.payment_status,
  b.status,
  TO_CHAR(b.scheduled_date, 'YYYY-MM-DD HH24:MI:SS') as scheduled_for
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
ORDER BY b.created_at DESC;

-- ==========================================
-- ✅ QUERIES COMPLETE!
-- ==========================================
-- Total: 32 Analytics Queries
-- Categories:
--   - Revenue & Bookings (5)
--   - Service Performance (3)
--   - Customer Insights (5)
--   - Conversion Funnel (1)
--   - Schedule (2)
--   - Language & Region (3)
--   - Performance (2)
--   - Notifications (2)
--   - Growth (2)
--   - Business Intelligence (3)
--   - System Health (2)
--   - Exports (2)
-- ==========================================
