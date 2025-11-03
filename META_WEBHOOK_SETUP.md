# 📱 META WHATSAPP WEBHOOK - Complete Setup Guide

## 🎯 WHAT YOU NEED TO CONFIGURE:

For Meta WhatsApp Business API, you need to:
1. Create Meta App
2. Add WhatsApp product
3. Configure webhook endpoint
4. Get credentials
5. Add to .env
6. Switch provider in admin dashboard

---

## 🚀 COMPLETE META SETUP (30 MINUTES):

### **STEP 1: Create Meta App** (5 minutes)

**1.1 Go to Meta for Developers:**
```
https://developers.facebook.com
```

**1.2 Create App:**
```
1. Click "My Apps" → "Create App"
2. Select use case: "Other"
3. Select app type: "Business"
4. Fill in:
   - App name: "Samia Tarot"
   - Contact email: your-email@example.com
5. Click "Create App"
```

**1.3 Add WhatsApp Product:**
```
1. In your app dashboard, find "Add Products"
2. Find "WhatsApp" → Click "Set up"
3. You'll see WhatsApp Getting Started page
```

---

### **STEP 2: Get Test Phone Number** (2 minutes)

**2.1 In WhatsApp → Getting Started:**
```
You'll see:
┌──────────────────────────────────────┐
│  Test with your own phone number     │
│  Phone Number ID: 123456789          │ ← COPY THIS!
│  Access Token: EAAxxxxxxxxxxxxxx     │ ← COPY THIS!
└──────────────────────────────────────┘
```

**2.2 Add Test Recipient:**
```
1. Find "To" field
2. Enter your phone number (with country code)
   Example: +9611234567
3. Click "Send message" to verify
4. You should receive a test message!
```

---

### **STEP 3: Get App Secret** (1 minute)

**3.1 Get App Secret:**
```
1. Left sidebar → Settings → Basic
2. Find: "App Secret"
3. Click "Show"
4. Copy the value
```

---

### **STEP 4: Configure Webhook** (5 minutes)

**4.1 Set Verify Token (Choose your own!):**
```
Think of a random secret token, example:
"samia_tarot_webhook_secret_2025"

You'll use this to verify webhook requests.
```

**4.2 Configure Webhook in Meta:**
```
1. WhatsApp → Configuration (left sidebar)
2. Find "Webhook" section
3. Click "Configure webhook"
4. You'll see a form:

   ┌────────────────────────────────────────┐
   │  Callback URL:                         │
   │  [https://your-url/api/webhook/whatsapp] │
   │                                        │
   │  Verify Token:                         │
   │  [samia_tarot_webhook_secret_2025]    │
   │                                        │
   │  [Verify and Save]                     │
   └────────────────────────────────────────┘
```

**For LOCAL testing with ngrok:**
```bash
# Terminal 1: Start app
npm run dev

# Terminal 2: Start ngrok
npx ngrok http 3000

# Copy ngrok URL (example):
https://abc123def456.ngrok.io

# In Meta webhook form:
Callback URL: https://abc123def456.ngrok.io/api/webhook/whatsapp
Verify Token: samia_tarot_webhook_secret_2025
```

**For PRODUCTION (after deployment):**
```
Callback URL: https://your-domain.com/api/webhook/whatsapp
Verify Token: samia_tarot_webhook_secret_2025
```

**4.3 Click "Verify and Save"**
```
Meta will send GET request to your webhook.
Your code will verify and return the challenge.
You should see: ✅ "Webhook verified successfully"
```

**4.4 Subscribe to Events:**
```
After verification, you'll see:
┌────────────────────────────────────────┐
│  Webhook fields                        │
│  [ ] messages  ← CHECK THIS BOX!       │
│  [ ] messaging_postbacks               │
│                                        │
│  [Subscribe]                           │
└────────────────────────────────────────┘

Check "messages" and click Subscribe.
```

---

### **STEP 5: Add Credentials to .env** (2 minutes)

**5.1 Open .env file:**
```
C:\Users\saeee\OneDrive\Documents\project\Whatsapp\samia-tarot-app\.env
```

**5.2 Find Meta section (around line 29):**
```env
# ==========================================
# 📱 META WHATSAPP (Alternative)
# ==========================================
META_WHATSAPP_PHONE_ID="your-phone-number-id"
META_WHATSAPP_TOKEN="your-access-token"
META_WHATSAPP_VERIFY_TOKEN="your-custom-verify-token"
META_APP_SECRET="your-app-secret"
```

**5.3 Replace with your actual values:**
```env
META_WHATSAPP_PHONE_ID="123456789"  ← From Step 2.1
META_WHATSAPP_TOKEN="EAAxxxxxxxxxxxxxxxxx"  ← From Step 2.1
META_WHATSAPP_VERIFY_TOKEN="samia_tarot_webhook_secret_2025"  ← You chose this
META_APP_SECRET="abc123xyz789"  ← From Step 3.1
```

**5.4 Change provider to Meta:**
```env
# Line 26
WHATSAPP_PROVIDER="meta"
```

**5.5 Save file** (Ctrl+S)

---

### **STEP 6: Test Meta Webhook** (5 minutes)

**6.1 Start your app:**
```bash
cd samia-tarot-app
npm run dev
```

**6.2 Start ngrok (if testing locally):**
```bash
# New terminal
npx ngrok http 3000

# Copy HTTPS URL
```

**6.3 Update webhook URL (if using ngrok):**
```
Meta Developer Dashboard → WhatsApp → Configuration → Edit Webhook
Update with new ngrok URL (ngrok URLs change each restart)
```

**6.4 Send test message:**
```
1. Meta Dashboard → WhatsApp → Getting Started
2. Find "Send and receive messages" section
3. To: +9611234567 (your phone)
4. Message: "Test"
5. Click "Send message"

OR send from your phone to Meta test number
```

**6.5 Check terminal logs:**
```
You should see:
📱 Webhook received from meta
💬 Message from +9611234567: "Test"
✅ Message processed in XXXms
```

**6.6 Receive AI response:**
```
On your phone:
"🔮 مرحباً بك في سامية تاروت!
اختر لغتك: 1️⃣ العربية 2️⃣ English"
```

---

## 🎛️ SWITCH PROVIDER FROM ADMIN DASHBOARD:

**After credentials are in .env:**

**Visit:**
```
http://localhost:3000/admin/settings
```

**You'll see:**
```
┌─────────────────────────────────────────────┐
│  📱 WhatsApp Provider                       │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌──────────────┐   │
│  │   📱 Meta    │      │  📞 Twilio   │   │
│  │  ✅ Active   │      │   Inactive   │   │
│  │              │      │              │   │
│  │ • Interactive│      │ • Quick setup│   │
│  │ • Templates  │      │ • Simple API │   │
│  │ • Official   │      │ • Instant    │   │
│  └──────────────┘      └──────────────┘   │
│                                             │
│  [Click card to switch provider]            │
└─────────────────────────────────────────────┘
```

**Just click the card!** No code editing needed! 🎉

---

## 🔄 WEBHOOK FLOW WITH META:

### **1. Webhook Verification (GET request):**
```
Meta sends:
GET /api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=123456

Your webhook responds:
- Checks if token matches META_WHATSAPP_VERIFY_TOKEN
- Returns challenge value
- Meta sees ✅ "Webhook verified"
```

### **2. Receiving Messages (POST request):**
```
Customer sends WhatsApp message
         ↓
Meta server receives it
         ↓
Meta sends POST to your webhook:
POST /api/webhook/whatsapp
Body: {
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "9611234567",
          "text": { "body": "مرحبا" },
          "timestamp": "1699123456"
        }]
      }
    }]
  }]
}
         ↓
Your webhook parses it
         ↓
Workflow processes message
         ↓
AI generates response
         ↓
Sends back via Meta API
         ↓
Customer receives response! 🎉
```

---

## 🧪 TEST META WEBHOOK:

### **Test 1: Verification (GET)**
```bash
# Test webhook verification
curl "http://localhost:3000/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=samia_tarot_webhook_secret_2025&hub.challenge=test123"

# Should return: test123
```

### **Test 2: Message Handling (POST)**
```bash
# Test message processing
curl -X POST http://localhost:3000/api/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "1234567890",
            "id": "msg_123",
            "timestamp": "1699123456",
            "text": { "body": "test" }
          }]
        }
      }]
    }]
  }'

# Should return: {"success": true}
```

---

## 📋 META .ENV CONFIGURATION:

**Complete Meta configuration in .env:**

```env
# ==========================================
# 📱 WHATSAPP PROVIDER - CHOOSE ONE
# ==========================================
WHATSAPP_PROVIDER="meta"  ← Change this to "meta"

# ==========================================
# 📱 META WHATSAPP
# ==========================================
# From: https://developers.facebook.com → Your App → WhatsApp

# Phone Number ID (from Getting Started page)
META_WHATSAPP_PHONE_ID="123456789012345"

# Access Token (from Getting Started page)
# Note: Get permanent token from System Users for production!
META_WHATSAPP_TOKEN="EAABsbCS1iHgBO7ZC9RGOaF8Cza..."

# Verify Token (YOU create this - any random string)
META_WHATSAPP_VERIFY_TOKEN="samia_tarot_webhook_secret_2025"

# App Secret (from Settings → Basic)
META_APP_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

---

## 🎯 COMPARISON: TWILIO VS META

### **For Webhook Setup:**

| Step | Twilio | Meta |
|------|--------|------|
| **Account Creation** | 5 min | 10 min |
| **Webhook Config** | 2 min | 5 min |
| **Verification** | Automatic | Manual GET request |
| **Sandbox** | Join with code | Add test numbers |
| **Production** | Needs approval | Needs business verification |
| **Ease** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**Recommendation:** Start with Twilio, switch to Meta later!

---

## 🎛️ HOW TO SWITCH PROVIDERS:

### **Method 1: Admin Dashboard** (Easiest!)
```
1. Visit: http://localhost:3000/admin/settings
2. Click the provider card you want (Meta or Twilio)
3. System switches automatically!
4. New messages use new provider!
```

### **Method 2: Edit .env**
```
Change line 26:
WHATSAPP_PROVIDER="twilio"  ← or "meta"

Restart app:
npm run dev
```

### **Method 3: Database**
```sql
-- In Supabase SQL Editor
UPDATE system_settings
SET setting_value = 'meta'
WHERE setting_key = 'whatsapp_provider';

-- Restart app for changes to take effect
```

---

## 📞 YOUR WEBHOOK ENDPOINT:

**Endpoint URL:**
```
/api/webhook/whatsapp
```

**Handles:**
- ✅ GET requests (webhook verification)
- ✅ POST requests (incoming messages)
- ✅ Both Meta and Twilio formats
- ✅ Signature verification
- ✅ Error handling
- ✅ Logging to database

**Your webhook is already built and supports both providers!** 🎉

---

## 🔧 DETAILED META WEBHOOK CONFIGURATION:

### **A. Using ngrok (Local Testing):**

**Terminal 1:**
```bash
cd samia-tarot-app
npm run dev
```

**Terminal 2:**
```bash
npx ngrok http 3000
```

**Copy ngrok URL:**
```
Forwarding: https://abc123def456.ngrok.io
```

**Configure in Meta:**
```
1. developers.facebook.com → Your App → WhatsApp → Configuration
2. Click "Edit" on Webhook section
3. Callback URL: https://abc123def456.ngrok.io/api/webhook/whatsapp
4. Verify token: samia_tarot_webhook_secret_2025 (or whatever you choose)
5. Click "Verify and Save"
6. Wait for ✅ verification
7. Subscribe to "messages" field
```

**Important:** ngrok URLs change every restart! Remember to update webhook URL each time.

---

### **B. Using Vercel (Production):**

**Deploy:**
```bash
vercel --prod
```

**Get URL:**
```
You'll get: https://samia-tarot-app.vercel.app
```

**Configure in Meta:**
```
Callback URL: https://samia-tarot-app.vercel.app/api/webhook/whatsapp
Verify token: samia_tarot_webhook_secret_2025
```

**This URL is permanent!** No need to update webhook.

---

### **C. Using Railway/Other Hosts:**

**Deploy to Railway:**
```bash
railway up
```

**Get domain:**
```
You'll get: https://samia-tarot-app.up.railway.app
```

**Configure in Meta:**
```
Callback URL: https://samia-tarot-app.up.railway.app/api/webhook/whatsapp
```

---

## 📝 COMPLETE .ENV FOR META:

**Edit your .env file:**

```env
# ==========================================
# 📱 WHATSAPP PROVIDER
# ==========================================
WHATSAPP_PROVIDER="meta"  ← Change to "meta"

# ==========================================
# 📱 META WHATSAPP BUSINESS API
# ==========================================
# Get from: https://developers.facebook.com → Your App → WhatsApp

# Phone Number ID (from Getting Started page, under "From")
META_WHATSAPP_PHONE_ID="123456789012345"

# Access Token (from Getting Started page)
# IMPORTANT: This is temporary! Get permanent token from System Users
META_WHATSAPP_TOKEN="EAABsbCS1iHgBO7ZC9RGOaFxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Verify Token (YOU create this - any random string)
# Must match what you enter in webhook configuration
META_WHATSAPP_VERIFY_TOKEN="samia_tarot_webhook_secret_2025"

# App Secret (Settings → Basic → App Secret → Show)
META_APP_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

---

## 🎯 WEBHOOK VERIFICATION PROCESS:

### **How Meta Verifies Your Webhook:**

**1. You configure webhook in Meta dashboard**

**2. Meta sends GET request:**
```
GET /api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=1234567890
```

**3. Your webhook code checks:**
```typescript
// In route.ts
export async function GET(request: NextRequest) {
  const mode = request.searchParams.get('hub.mode')
  const token = request.searchParams.get('hub.verify_token')
  const challenge = request.searchParams.get('hub.challenge')

  // Verify token matches
  if (mode === 'subscribe' && token === process.env.META_WHATSAPP_VERIFY_TOKEN) {
    // Return challenge
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

**4. Meta receives challenge back**

**5. ✅ Webhook verified!**

---

## 🧪 TEST META WEBHOOK:

### **Test Verification (Before configuring in Meta):**

```bash
# Make sure app is running
npm run dev

# Test GET verification
curl "http://localhost:3000/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=samia_tarot_webhook_secret_2025&hub.challenge=test_challenge_12345"

# Should return: test_challenge_12345

# If it returns the challenge, Meta verification will work! ✅
```

### **Test Message Reception:**

**Send test via Meta API:**
```bash
# In Meta Dashboard → WhatsApp → Getting Started
# "Send and receive messages" section

To: +9611234567 (your phone)
Message: "مرحبا"
Click: Send message

# Check your phone - should receive AI response!
```

**Check terminal:**
```
📱 Webhook received from meta
💬 Message from 9611234567: "مرحبا"
👤 Step 1: Get/Create customer...
✅ Message processed
```

**Check database:**
```sql
-- In Supabase SQL Editor
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 1;
SELECT * FROM customers ORDER BY created_at DESC LIMIT 1;
SELECT * FROM conversations ORDER BY created_at DESC LIMIT 1;
```

---

## 🎉 AFTER SETUP - MANAGE FROM DASHBOARD:

**Visit:** `http://localhost:3000/admin/settings`

### **You'll see:**

```
┌─────────────────────────────────────────────┐
│  🔍 System Status                           │
├─────────────────────────────────────────────┤
│  🤖 OpenAI       ✅ Ready                   │
│  📱 Meta         ✅ Ready  ← Will show this │
│  📞 Twilio       ❌ Not Set                 │
│  💾 Supabase     ✅ Ready                   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  📱 WhatsApp Provider                       │
├─────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐          │
│  │  📱 Meta    │  │ 📞 Twilio   │          │
│  │ ✅ Active   │  │  Inactive   │          │
│  └─────────────┘  └─────────────┘          │
│                                             │
│  Click to switch provider!                  │
└─────────────────────────────────────────────┘
```

**Switch with one click!** No restart needed! 🎉

---

## ⚠️ IMPORTANT NOTES:

### **Temporary vs Permanent Token:**

**Meta gives you 2 types of tokens:**

1. **Temporary Token** (24 hours)
   - From "Getting Started" page
   - Good for testing
   - Expires in 24 hours!

2. **Permanent Token** (Never expires)
   - From System Users
   - Required for production
   - Doesn't expire

**How to get permanent token:**
```
1. Meta Business Suite → Business Settings
2. Users → System Users
3. Create system user "Samia Tarot Bot"
4. Assets → Add asset → Your app
5. Generate token
6. Permissions: whatsapp_business_messaging
7. Copy token (starts with EAA...)
8. Use this in production!
```

---

## 📊 WEBHOOK DEBUGGING:

### **Check if webhook is working:**

**1. Webhook logs in database:**
```sql
SELECT
  provider,
  event_type,
  processed,
  error,
  processing_time_ms,
  created_at
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 10;
```

**2. Terminal logs:**
```
npm run dev shows real-time logs:
📱 Webhook received from meta ✅
💬 Message from XXX ✅
✅ Message processed in 1234ms ✅
```

**3. Meta Dashboard:**
```
WhatsApp → Configuration → Webhook
Shows: Last webhook response time and status
```

---

## 🎯 QUICK REFERENCE:

### **ngrok commands:**
```bash
# Start ngrok
npx ngrok http 3000

# With custom subdomain (paid ngrok)
ngrok http 3000 --subdomain=samia-tarot

# View dashboard
http://localhost:4040  ← Shows all requests!
```

### **Webhook URLs:**

**Local (ngrok):**
```
https://abc123.ngrok.io/api/webhook/whatsapp
```

**Production (Vercel):**
```
https://samia-tarot-app.vercel.app/api/webhook/whatsapp
```

**Production (Railway):**
```
https://samia-tarot-app.up.railway.app/api/webhook/whatsapp
```

**Production (Custom domain):**
```
https://booking.samiatarot.com/api/webhook/whatsapp
```

---

## ✅ COMPLETE SETUP CHECKLIST:

**Meta Account:**
- [ ] Create Meta developer account
- [ ] Create app (Business type)
- [ ] Add WhatsApp product
- [ ] Get test phone number

**Credentials:**
- [ ] Copy Phone Number ID
- [ ] Copy Access Token
- [ ] Create Verify Token (your choice)
- [ ] Copy App Secret
- [ ] Add all to .env

**Webhook:**
- [ ] Start app (npm run dev)
- [ ] Start ngrok (npx ngrok http 3000)
- [ ] Configure webhook URL in Meta
- [ ] Enter verify token
- [ ] Click "Verify and Save"
- [ ] Subscribe to "messages"

**Testing:**
- [ ] Send test message from Meta dashboard
- [ ] Or send from your phone
- [ ] Check terminal logs
- [ ] Verify response received
- [ ] Check database (customers, conversations)

**Admin Dashboard:**
- [ ] Visit /admin/settings
- [ ] See Meta status ✅ Ready
- [ ] Click Meta card to activate
- [ ] Test provider switching

---

## 🎊 YOU'RE READY!

**Your webhook endpoint:**
```
✅ Already built
✅ Supports Meta AND Twilio
✅ Handles verification
✅ Parses messages
✅ Processes with AI
✅ Saves to database
✅ Sends responses
✅ Logs everything
```

**Just configure:**
1. Add Meta credentials to .env (4 values)
2. Configure webhook URL (with ngrok or production URL)
3. Test!

**Then manage everything from admin dashboard!** 🎛️

---

**TAYEB NABIL! Choose your provider (Meta or Twilio), configure webhook, and TEST!** 🚀💪

**Quick comparison:**
- **Twilio**: Easier setup (5 min), instant sandbox, pay per message
- **Meta**: Official platform (30 min), business verification, free tier

**Both work perfectly with your system!** Switch anytime from admin dashboard! 🎉

🔮✨🌙
