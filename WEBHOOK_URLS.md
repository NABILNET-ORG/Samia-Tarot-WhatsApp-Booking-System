# 📞 WEBHOOK URLS FOR YOUR DOMAIN

## 🌐 YOUR DOMAIN:
```
https://samia-tarot-app.vercel.app
```

---

## 🔗 WEBHOOK ENDPOINTS:

### **1️⃣ META WHATSAPP WEBHOOK** 📱

**Webhook URL:**
```
https://samia-tarot-app.vercel.app/api/webhook/whatsapp
```

**Configuration:**
```
Where: https://developers.facebook.com
Path: Your App → WhatsApp → Configuration → Webhook

Settings:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Callback URL:
https://samia-tarot-app.vercel.app/api/webhook/whatsapp

Verify Token:
[Your META_WHATSAPP_VERIFY_TOKEN from .env]

Webhook Fields:
☑ messages  ← CHECK THIS!

Click: "Verify and Save"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Method:**
- GET (for verification)
- POST (for messages)

**Meta Phone Number:** `+15556320392`

---

### **2️⃣ TWILIO WHATSAPP WEBHOOK** 📞

**Webhook URL:**
```
https://samia-tarot-app.vercel.app/api/webhook/whatsapp
```

**Configuration:**
```
Where: https://console.twilio.com
Path: Messaging → Try WhatsApp → Sandbox Settings

Settings:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHEN A MESSAGE COMES IN:
https://samia-tarot-app.vercel.app/api/webhook/whatsapp

HTTP Method: POST

Click: "Save"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Method:** POST only

---

### **3️⃣ STRIPE WEBHOOK** 💳

**Webhook URL:**
```
https://samia-tarot-app.vercel.app/api/webhook/stripe
```

**Configuration:**
```
Where: https://dashboard.stripe.com
Path: Developers → Webhooks → Add endpoint

Settings:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Endpoint URL:
https://samia-tarot-app.vercel.app/api/webhook/stripe

Events to send:
☑ checkout.session.completed
☑ payment_intent.succeeded
☑ payment_intent.payment_failed

Click: "Add endpoint"

Then copy the "Signing secret" (whsec_...)
Add to .env as: STRIPE_WEBHOOK_SECRET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Method:** POST

**⚠️ Note:** You'll need to create this route! (Not built yet)

---

## 📋 ALL WEBHOOK URLS SUMMARY:

| Service | Webhook URL | Method |
|---------|-------------|--------|
| **Meta WhatsApp** | `https://samia-tarot-app.vercel.app/api/webhook/whatsapp` | GET + POST |
| **Twilio WhatsApp** | `https://samia-tarot-app.vercel.app/api/webhook/whatsapp` | POST |
| **Stripe Payments** | `https://samia-tarot-app.vercel.app/api/webhook/stripe` | POST |

---

## 🔄 OTHER WEBHOOKS YOU MIGHT NEED:

### **4️⃣ Google Calendar (Optional)**
**Not a webhook!** You call Google API, they don't call you.

### **5️⃣ Google Contacts (Optional)**
**Not a webhook!** You call Google API, they don't call you.

---

## ✅ WEBHOOKS ALREADY BUILT:

```
✅ Meta WhatsApp: /api/webhook/whatsapp
✅ Twilio WhatsApp: /api/webhook/whatsapp (same endpoint!)
⏳ Stripe: Need to create /api/webhook/stripe
```

**Your WhatsApp webhook handles BOTH Meta and Twilio!** 🎉

---

## 🔧 CONFIGURATION STEPS:

### **STEP 1: Configure Meta Webhook**

```bash
1. Go to: https://developers.facebook.com
2. Your App → WhatsApp → Configuration
3. Edit Webhook:

   Callback URL: https://samia-tarot-app.vercel.app/api/webhook/whatsapp
   Verify Token: [from your .env: META_WHATSAPP_VERIFY_TOKEN]

4. Click "Verify and Save"
   → Should see: ✅ "Verified"

5. Subscribe to: messages
```

### **STEP 2: Configure Twilio Webhook**

```bash
1. Go to: https://console.twilio.com
2. Messaging → Try WhatsApp → Sandbox Settings
3. When a message comes in:

   https://samia-tarot-app.vercel.app/api/webhook/whatsapp

4. Method: POST
5. Save
```

### **STEP 3: Test Webhooks**

**For Meta:**
```
Send message to: +15556320392
From: Your phone
Message: "مرحبا"

Expected: AI response
```

**For Twilio:**
```
Send message to: +14155238886
From: Your phone
Message: "مرحبا"

Expected: AI response
```

---

## 📱 META PHONE NUMBER UPDATE:

**Your Meta Number:** `+15556320392`

Let me update it in your .env!

---

## 🧪 WEBHOOK TESTING:

### **Test 1: Meta Verification (GET)**
```bash
curl "https://samia-tarot-app.vercel.app/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test123"

# Should return: test123
```

### **Test 2: Check Endpoint Exists**
```bash
curl -I https://samia-tarot-app.vercel.app/api/webhook/whatsapp

# Should return: 200 OK or 403 (not 404!)
```

### **Test 3: Send Test Message**
```
Use Meta/Twilio dashboard to send test message
Check Vercel function logs for webhook execution
```

---

## 🎯 WEBHOOK FLOW:

```
Customer sends WhatsApp
        ↓
Meta/Twilio receives
        ↓
Sends POST to webhook:
https://samia-tarot-app.vercel.app/api/webhook/whatsapp
        ↓
Your Next.js API route
        ↓
WorkflowEngine.processMessage()
        ↓
AI analyzes with GPT-4
        ↓
Saves to Supabase
        ↓
Sends response via Meta/Twilio API
        ↓
Customer receives AI response!
```

---

## 📊 SUMMARY:

**Webhooks needed:**
- ✅ WhatsApp (Meta/Twilio): Already built!
- ⏳ Stripe: Need to create (optional for now)

**Your webhook URLs:**
```
Meta: https://samia-tarot-app.vercel.app/api/webhook/whatsapp
Twilio: https://samia-tarot-app.vercel.app/api/webhook/whatsapp
Stripe: https://samia-tarot-app.vercel.app/api/webhook/stripe (to be created)
```

**Meta Phone:** `+15556320392`

---

**NABIL! Here are all your webhook URLs! Configure them in Meta and Twilio dashboards now!** 🚀

🔮✨🌙
