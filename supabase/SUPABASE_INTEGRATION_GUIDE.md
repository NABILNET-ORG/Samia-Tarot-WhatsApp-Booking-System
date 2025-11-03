# 🔮 SUPABASE INTEGRATION GUIDE - Samia Tarot

## 🎉 YALLA NABIL! Complete Supabase Setup!

This guide will show you how to set up **Supabase** for your Samia Tarot WhatsApp booking system with **full conversation memory, analytics, and customer tracking**!

---

## ✨ WHAT YOU GET WITH SUPABASE

### 1. **Conversation Memory** 🧠
- Never lose conversation context (even if workflow restarts!)
- AI remembers last 20 messages
- Resume booking from exactly where customer left off

### 2. **Complete Customer Profiles** 👤
- Track every booking, every message
- See lifetime value instantly
- Know who your VIP customers are

### 3. **Real-Time Analytics** 📊
- Today's revenue (instant!)
- Popular services
- Conversion rates
- Customer retention

### 4. **Smart Insights** 💡
- Which services make most money?
- When do people book most?
- Who hasn't booked in 30 days?
- What's your conversion funnel?

---

## 🚀 STEP 1: RUN THE SQL SCHEMA

You already have Supabase! Let's create the tables:

### **A. Open Supabase Dashboard**
1. Go to: https://supabase.com/dashboard
2. Select your project: `samia-tarot`

### **B. Open SQL Editor**
1. Click "SQL Editor" in left sidebar
2. Click "New Query"

### **C. Copy & Paste Schema**
1. Open file: `supabase/SUPABASE_SETUP.sql`
2. Copy ENTIRE contents
3. Paste into Supabase SQL Editor
4. Click "Run" (or press `Ctrl+Enter`)

### **D. Verify Tables Created**
Run this query:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**You should see**:
- admin_notifications
- analytics_events
- bookings
- conversations
- customers
- service_performance
- system_settings
- webhook_logs

✅ **Tables created!**

---

## 🔧 STEP 2: CONFIGURE ENVIRONMENT VARIABLES

Your credentials are already set! Let's verify:

### **A. Check .env.example**
File already updated with:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://lovvgshqnqqlzbiviate.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Database URL
DATABASE_URL="postgresql://postgres.lovvgshqnqqlzbiviate:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

### **B. Create .env**
```bash
cp .env.example .env
```

✅ **Environment configured!**

---

## 📦 STEP 3: INSTALL DEPENDENCIES

```bash
cd samia-tarot-app
npm install
```

This will install:
- `@supabase/supabase-js` (already added to package.json)
- All other dependencies

✅ **Dependencies installed!**

---

## 🧪 STEP 4: TEST SUPABASE CONNECTION

### **A. Test in Supabase Dashboard**

Run this query to test:
```sql
-- Insert test customer
INSERT INTO customers (phone, name_english, preferred_language)
VALUES ('+9611234567', 'Test Customer', 'ar')
RETURNING *;

-- Query it back
SELECT * FROM customers WHERE phone = '+9611234567';
```

**Expected**: You see the customer data returned!

### **B. Test from Node.js** (Optional)

Create test file: `test-supabase.js`
```javascript
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://lovvgshqnqqlzbiviate.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Your anon key
)

async function test() {
  // Query customers
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .limit(5)

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Success! Customers:', data)
  }
}

test()
```

Run:
```bash
node test-supabase.js
```

✅ **Connection works!**

---

## 🔄 STEP 5: UPDATE WEBHOOK HANDLER

### **Option A: Replace Entire File** (Easiest!)

```bash
# Backup old file
mv src/app/api/webhook/whatsapp/route.ts src/app/api/webhook/whatsapp/route-old.ts

# Use Supabase version
mv src/app/api/webhook/whatsapp/route-with-supabase.ts src/app/api/webhook/whatsapp/route.ts
```

### **Option B: Manual Integration**

Add Supabase to your existing webhook:

```typescript
// At top of file
import { supabaseAdmin, supabaseHelpers } from '@/lib/supabase/client'

// In POST handler
export async function POST(request: NextRequest) {
  try {
    // ... existing code ...

    // 1. Get or create customer
    const customer = await supabaseHelpers.getOrCreateCustomer(from)

    // 2. Get conversation (with memory!)
    let conversation = await supabaseHelpers.getActiveConversation(from)

    if (!conversation) {
      conversation = await supabaseHelpers.upsertConversation(from, {
        customer_id: customer.id,
        current_state: 'GREETING',
        language: 'ar',
      })
    }

    // 3. Add message to history
    await supabaseHelpers.addMessageToHistory(
      conversation.id,
      'user',
      messageBody
    )

    // 4. Call AI with conversation history
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversation.message_history.map(m => ({
        role: m.role,
        content: m.content
      })),
      { role: 'user', content: messageBody }
    ]

    // ... AI call ...

    // 5. Save AI response
    await supabaseHelpers.addMessageToHistory(
      conversation.id,
      'assistant',
      aiResponse.message
    )

    // 6. Update conversation state
    await supabaseHelpers.upsertConversation(from, {
      current_state: aiResponse.state,
      language: aiResponse.language,
    })

    // 7. Track analytics
    await supabaseHelpers.trackEvent('message_received', {
      phone: from,
      customer_id: customer.id,
    })

    // ... rest of code ...
  } catch (error) {
    // Log error to Supabase
    await supabaseHelpers.logWebhook({
      provider: 'meta',
      event_type: 'error',
      payload: { error: error.message },
      error: error.stack,
    })
  }
}
```

✅ **Webhook integrated!**

---

## 📊 STEP 6: TEST ANALYTICS QUERIES

### **A. Open Supabase Dashboard**
SQL Editor → New Query

### **B. Try These Queries**

**Today's Revenue:**
```sql
SELECT
  COUNT(*) as total_bookings,
  SUM(amount) FILTER (WHERE payment_status = 'completed') as revenue
FROM bookings
WHERE DATE(created_at) = CURRENT_DATE;
```

**Top Customers:**
```sql
SELECT
  name_english,
  phone,
  total_bookings,
  total_spent,
  vip_status
FROM customers
WHERE total_bookings > 0
ORDER BY total_spent DESC
LIMIT 10;
```

**Popular Services:**
```sql
SELECT
  service_name,
  COUNT(*) as bookings,
  SUM(amount) as revenue
FROM bookings
WHERE payment_status = 'completed'
GROUP BY service_name
ORDER BY revenue DESC;
```

**More queries in**: `supabase/ANALYTICS_QUERIES.sql` (32 total!)

✅ **Analytics working!**

---

## 🎯 STEP 7: HOW TO USE IN YOUR WORKFLOW

### **A. Conversation Memory Example**

**Before Supabase** ❌:
```
Customer: "Hi"
Bot: "Choose language: 1 or 2"
Customer: "2"
Bot: "Select service..."
[Workflow crashes]
Customer: "Hi" (tries again)
Bot: "Choose language: 1 or 2" ← Starts over! 😤
```

**With Supabase** ✅:
```
Customer: "Hi"
Bot: "Choose language: 1 or 2"
Customer: "2"
Bot: "Select service..."
[Workflow crashes]
Customer: "Hi" (tries again)
Bot: "You were selecting a service. Here's the menu:" ← Resumes! 🎉
```

### **B. Customer History Example**

```javascript
// Get customer
const customer = await supabaseHelpers.getOrCreateCustomer('+9611234567')

console.log(customer)
// {
//   phone: '+9611234567',
//   name_english: 'Nabil Zein',
//   total_bookings: 5,
//   total_spent: 750,
//   vip_status: true,
//   last_booking_date: '2025-01-15'
// }

// VIP customer! Give them priority!
```

### **C. Analytics Example**

```sql
-- See conversion funnel
SELECT
  COUNT(DISTINCT phone) as total_contacts,
  COUNT(DISTINCT phone) FILTER (WHERE event_type = 'service_selected') as selected_service,
  COUNT(DISTINCT phone) FILTER (WHERE event_type = 'payment_completed') as completed_payment
FROM analytics_events
WHERE created_at >= CURRENT_DATE;

-- Result:
-- total_contacts: 50
-- selected_service: 30 (60% conversion)
-- completed_payment: 18 (36% overall, 60% of selections)
```

---

## 💡 STEP 8: PRACTICAL USE CASES

### **1. Send Follow-Up to Inactive Customers**

```sql
-- Find customers who haven't booked in 30 days
SELECT name_english, phone, total_spent
FROM customers
WHERE last_booking_date < CURRENT_DATE - INTERVAL '30 days'
  AND total_bookings >= 2  -- They liked it before!
ORDER BY total_spent DESC
LIMIT 20;
```

**Action**: Send them "We miss you! 15% off your next reading"

### **2. Thank Your VIPs**

```sql
-- Find VIP customers
SELECT name_english, phone, total_spent
FROM customers
WHERE vip_status = true
ORDER BY total_spent DESC;
```

**Action**: Send personal thank you message + special offer

### **3. Track Today's Schedule**

```sql
-- See all today's bookings
SELECT
  TO_CHAR(scheduled_date, 'HH12:MI AM') as time,
  c.name_english,
  b.service_name,
  b.google_meet_link
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
WHERE DATE(b.scheduled_date) = CURRENT_DATE
ORDER BY b.scheduled_date;
```

**Samia knows exactly what's happening today!**

### **4. Optimize Services**

```sql
-- Which service makes most money?
SELECT
  service_name,
  COUNT(*) as bookings,
  SUM(amount) as revenue,
  AVG(amount) as avg_price
FROM bookings
WHERE payment_status = 'completed'
GROUP BY service_name
ORDER BY revenue DESC;
```

**Decision**: Focus marketing on high-revenue services!

---

## 🔍 STEP 9: MONITOR & DEBUG

### **Check Active Conversations**
```sql
SELECT
  phone,
  current_state,
  language,
  last_message_at
FROM conversations
WHERE is_active = true
ORDER BY last_message_at DESC;
```

### **Check Webhook Logs**
```sql
SELECT
  provider,
  event_type,
  processed,
  error,
  created_at
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 20;
```

### **Check Recent Bookings**
```sql
SELECT
  c.name_english,
  b.service_name,
  b.amount,
  b.payment_status,
  b.created_at
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
ORDER BY b.created_at DESC
LIMIT 10;
```

---

## 📊 STEP 10: BUILD DASHBOARD (Optional)

Create a simple analytics dashboard in admin panel:

```typescript
// src/app/admin/analytics/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    todayRevenue: 0,
    totalCustomers: 0,
    vipCustomers: 0,
  })

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    // Today's revenue
    const { data: bookings } = await supabase
      .from('bookings')
      .select('amount, payment_status')
      .gte('created_at', new Date().toISOString().split('T')[0])

    const todayRevenue = bookings
      ?.filter(b => b.payment_status === 'completed')
      .reduce((sum, b) => sum + b.amount, 0) || 0

    // Customer stats
    const { data: customers } = await supabase
      .from('customers')
      .select('id, vip_status')

    setStats({
      todayRevenue,
      totalCustomers: customers?.length || 0,
      vipCustomers: customers?.filter(c => c.vip_status).length || 0,
    })
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <h2 className="text-gray-600">Today's Revenue</h2>
          <p className="text-4xl font-bold text-purple-600">
            ${stats.todayRevenue}
          </p>
        </div>

        <div className="card">
          <h2 className="text-gray-600">Total Customers</h2>
          <p className="text-4xl font-bold text-purple-600">
            {stats.totalCustomers}
          </p>
        </div>

        <div className="card">
          <h2 className="text-gray-600">VIP Customers</h2>
          <p className="text-4xl font-bold text-purple-600">
            {stats.vipCustomers} 👑
          </p>
        </div>
      </div>
    </div>
  )
}
```

---

## 🎉 CONGRATULATIONS!

You now have:
- ✅ 8 database tables set up
- ✅ Conversation memory (never loses context!)
- ✅ Complete customer tracking
- ✅ 32 analytics queries ready
- ✅ Webhook integration
- ✅ Real-time insights

---

## 💰 COSTS

**Your Usage** (estimated):
- Database: 100-200 bookings/month = **0.2MB**
- Conversations: ~1000/month = **2MB**
- **Total**: ~5MB used out of 500MB free

**You're using <1% of free tier!** Free forever! 🎉

---

## 🆘 TROUBLESHOOTING

### **Issue: Tables not created**
```sql
-- Check for errors
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Re-run schema
-- Copy SUPABASE_SETUP.sql again and run
```

### **Issue: Can't connect from Next.js**
```bash
# Check environment variables
cat .env | grep SUPABASE

# Should see 3 variables:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
```

### **Issue: Data not saving**
```typescript
// Check Supabase client
import { supabaseAdmin } from '@/lib/supabase/client'

const { data, error } = await supabaseAdmin
  .from('customers')
  .select('*')
  .limit(1)

console.log('Data:', data)
console.log('Error:', error) // Should be null
```

---

## 📚 WHAT'S INCLUDED

**Files Created:**
1. `supabase/SUPABASE_SETUP.sql` - Complete database schema
2. `supabase/ANALYTICS_QUERIES.sql` - 32 ready-to-use queries
3. `src/lib/supabase/client.ts` - Supabase client with helpers
4. `src/app/api/webhook/whatsapp/route-with-supabase.ts` - Integrated webhook
5. `supabase/SUPABASE_INTEGRATION_GUIDE.md` - This guide!

**What You Get:**
- 8 database tables
- 30+ indexes for fast queries
- 5 triggers for auto-updates
- 4 views for quick reports
- 3 helper functions
- 32 analytics queries
- Full TypeScript types
- Complete integration code

---

## 🚀 NEXT STEPS

1. **Run SQL schema** (5 minutes)
2. **Test connection** (2 minutes)
3. **Update webhook** (10 minutes)
4. **Try analytics queries** (5 minutes)
5. **Deploy** and watch magic happen! ✨

---

**Yalla Nabil! Supabase integration COMPLETE! 🎉**

Now you have:
- 🧠 Perfect conversation memory
- 👤 Complete customer profiles
- 📊 Real-time analytics
- 💡 Business insights
- 🎯 Data-driven decisions

**FREE FOREVER (at your scale)!** 💪

🔮✨🌙
