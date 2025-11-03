# 🔍 DEBUG STEPS - Why No Reply?

## ✅ WHAT YOU'VE DONE:

- ✅ Updated META_WHATSAPP_TOKEN in Vercel
- ✅ Updated in .env
- ✅ Webhook verified in Meta
- ✅ All environment variables set

## 🎯 LET'S DEBUG TOGETHER:

### **STEP 1: Check if "messages" is Subscribed**

**In Meta Dashboard → WhatsApp → Configuration:**

Scroll down to "Webhook fields" section

**Find the field called: `messages`**

**Check the status:**
- ✅ If it says "Subscribed" → Good!
- ❌ If it says "Unsubscribed" → Click toggle to subscribe!

---

### **STEP 2: Check WHATSAPP_PROVIDER Setting**

**Visit this URL:**
```
https://samia-tarot-app.vercel.app/api/test-env
```

**Look for:**
```json
"WHATSAPP_PROVIDER": "???"
```

**Should be:** `"meta"` (not "twilio"!)

**If it shows "twilio":**
1. Vercel → Environment Variables
2. Find: WHATSAPP_PROVIDER
3. Edit → Change to: `meta`
4. Save
5. Redeploy

---

### **STEP 3: Send Test Message and Check Logs**

**A. Send WhatsApp message:**
```
To: +15556320392
Message: "test"
```

**B. Immediately check Vercel logs:**
```
1. Go to: https://vercel.com/nabils-projects-447e19b8/samia-tarot-app
2. Click: "Logs" (top menu)
3. Select: "Functions" (filter)
4. Look for: POST /api/webhook/whatsapp
```

**What do you see?**

**Option A: You see POST /api/webhook/whatsapp**
```
✅ Webhook is receiving messages!
Click on the log to see details
Check for errors
```

**Option B: You don't see any logs**
```
❌ Webhook not receiving messages
Problem: Meta not sending to webhook
Solution: Check "messages" subscription in Meta
```

---

### **STEP 4: Check Supabase Database**

**Run in Supabase SQL Editor:**
```sql
-- Check if webhook received anything
SELECT * FROM webhook_logs
ORDER BY created_at DESC
LIMIT 5;

-- Check if customers created
SELECT * FROM customers
ORDER BY created_at DESC
LIMIT 5;

-- Check if conversations created
SELECT * FROM conversations
ORDER BY created_at DESC
LIMIT 5;
```

**What do you see?**

**If tables have data:** Webhook is working! ✅
**If tables empty:** Webhook not receiving messages ❌

---

### **STEP 5: Test Meta Webhook Delivery**

**In Meta Dashboard:**
```
WhatsApp → Configuration → Webhook

Find: Test button (if available)
OR
Use "Send test event" option
```

**This forces Meta to send test webhook to your endpoint.**

---

## 🎯 POSSIBLE ISSUES:

### **Issue 1: Not Subscribed to "messages"**
**Check:** Meta → Configuration → Webhook fields → messages → Should say "Subscribed"
**Fix:** Click toggle to subscribe

### **Issue 2: Provider set to "twilio"**
**Check:** https://samia-tarot-app.vercel.app/api/test-env
**Fix:** Change WHATSAPP_PROVIDER to "meta" in Vercel

### **Issue 3: META_WHATSAPP_PHONE_ID wrong**
**Check:** Vercel env vars → META_WHATSAPP_PHONE_ID
**Should match:** The Phone Number ID from Meta Getting Started page

### **Issue 4: Webhook not reachable**
**Test:** curl https://samia-tarot-app.vercel.app/api/webhook/whatsapp
**Should return:** Something (not 404)

### **Issue 5: Need to redeploy after token update**
**Fix:** Vercel → Deployments → Redeploy

---

## 🧪 QUICK TESTS:

### **Test 1: Check endpoint is alive**
```bash
curl -I https://samia-tarot-app.vercel.app/api/webhook/whatsapp
# Should return: 200 or 403 (not 404!)
```

### **Test 2: Test Meta verification**
```bash
curl "https://samia-tarot-app.vercel.app/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=samia_tarot_webhook_secret_2025&hub.challenge=abc123"
# Should return: abc123
```

### **Test 3: Check env vars loaded**
```bash
curl https://samia-tarot-app.vercel.app/api/test-env
# Should show all ✅ Set
```

---

## 📞 WHAT TO TELL ME:

**Please check and tell me:**

1. Is "messages" field **Subscribed** in Meta? (yes/no)
2. What does https://samia-tarot-app.vercel.app/api/test-env show for WHATSAPP_PROVIDER?
3. Do you see any logs in Vercel when you send message? (yes/no)
4. Any data in Supabase webhook_logs table? (yes/no)

**With these answers, I can pinpoint the exact issue!** 🎯

---

**NABIL! Check these 4 things and let me know what you find!** 🔍

🔮✨🌙
