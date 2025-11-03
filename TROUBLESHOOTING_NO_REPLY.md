# 🔍 TROUBLESHOOTING - Not Receiving Replies

## 🎯 CHECKLIST TO DEBUG:

### **1. Check Webhook is Subscribed** ✅

**In Meta Dashboard:**
```
WhatsApp → Configuration → Webhook fields

Make sure "messages" is checked and says "Subscribed"
```

**If not subscribed:**
- Click the toggle next to "messages"
- Should change from "Unsubscribed" to "Subscribed"

---

### **2. Check Message Was Sent to Correct Number**

**Your Meta WhatsApp Number:** `+15556320392`

**Make sure you sent message to this number, NOT:**
- ❌ Admin number (+9613620860)
- ❌ Twilio sandbox (+14155238886)
- ❌ Any other number

---

### **3. Check Webhook is Receiving Messages**

**Visit Vercel Logs:**
```
https://vercel.com/nabils-projects-447e19b8/samia-tarot-app/logs
```

**Filter by:** Functions

**Look for:**
```
POST /api/webhook/whatsapp
```

**If you see logs:** Webhook is receiving! ✅
**If no logs:** Webhook not receiving messages ❌

---

### **4. Check Supabase for Webhook Logs**

**Go to Supabase SQL Editor:**
```sql
SELECT * FROM webhook_logs
ORDER BY created_at DESC
LIMIT 10;
```

**Check:**
- Are there any logs?
- What's the payload?
- Any errors?

---

### **5. Test Webhook Directly**

**Test if webhook endpoint is accessible:**
```bash
curl -X POST https://samia-tarot-app.vercel.app/api/webhook/whatsapp \
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
```

**Should return:** `{"success": true}`

---

### **6. Check Meta Dashboard - Activity Log**

**Go to:** App Dashboard → Webhooks → Activity Log

**Look for:**
- Outgoing webhook calls
- Response codes
- Any errors

---

## 🔧 COMMON ISSUES:

### **Issue 1: Webhook not subscribed**
**Solution:** Subscribe to "messages" field in Meta Configuration

### **Issue 2: Message sent to wrong number**
**Solution:** Send to +15556320392 (not admin number!)

### **Issue 3: Webhook endpoint not working**
**Solution:** Check Vercel function logs for errors

### **Issue 4: Environment variables not set**
**Solution:** Already verified - all set ✅

### **Issue 5: Provider set to Twilio**
**Solution:** Change to Meta in database or settings page

---

## 🎯 QUICK DEBUG STEPS:

**1. Check current provider:**
```
Visit: https://samia-tarot-app.vercel.app/api/test-env

Look for: "WHATSAPP_PROVIDER": "meta" or "twilio"
```

**2. If provider is "twilio" but you want Meta:**
```sql
-- In Supabase SQL Editor
UPDATE system_settings
SET setting_value = 'meta'
WHERE setting_key = 'whatsapp_provider';
```

**Or use Settings page:**
```
https://samia-tarot-app.vercel.app/admin/settings
Click Meta card
```

**3. Check Meta phone number ID:**
```
Vercel env vars → META_WHATSAPP_PHONE_ID
Should match the Phone Number ID from Meta Getting Started page
```

---

## 🧪 TEST SENDING:

**Method 1: From Meta Dashboard**
```
WhatsApp → Getting Started → "Send and receive messages"
To: [Your phone number]
Message: "test"
Click: Send message
```

**Method 2: From Your Phone**
```
Open WhatsApp
New message to: +15556320392
Type: "مرحبا"
Send
```

---

## 📊 WHAT SHOULD HAPPEN:

```
You send: "مرحبا"
      ↓
Meta receives message
      ↓
Meta sends to webhook:
POST https://samia-tarot-app.vercel.app/api/webhook/whatsapp
      ↓
Your app logs: "📱 Webhook received from meta"
      ↓
WorkflowEngine processes
      ↓
AI generates response
      ↓
Sends back via Meta API
      ↓
You receive: "🔮 مرحباً بك في سامية تاروت!..."
```

---

## 🆘 IF STILL NOT WORKING:

**Check these in order:**

1. ✅ Webhook verified (you did this!)
2. ✅ Subscribed to "messages" (do this now!)
3. ⏳ Sent message to correct number (+15556320392)
4. ⏳ Check Vercel function logs
5. ⏳ Check Supabase webhook_logs table
6. ⏳ Verify META_WHATSAPP_PHONE_ID matches Meta dashboard
7. ⏳ Verify META_WHATSAPP_TOKEN is valid

---

## 🎯 MOST LIKELY ISSUE:

**You haven't subscribed to "messages" field yet!**

**In your screenshot, I can see webhook fields but can't see if "messages" is subscribed.**

**Action:**
```
Scroll down in Meta Configuration page
Find: "messages" field
Click toggle to Subscribe
Should change from "Unsubscribed" to "Subscribed"
```

**Then try sending message again!**

---

**NABIL! Subscribe to "messages" field in Meta, then send test message!** 🚀

**After subscribing, send:** "مرحبا" to +15556320392

**Should work!** ✅

🔮✨🌙