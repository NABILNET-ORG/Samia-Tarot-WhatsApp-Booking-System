# ⚡ QUICK ANSWERS - Environment Variables & Webhooks

## 🎯 YOUR QUESTIONS ANSWERED:

### **Q1: Should I add webhooks to environment variables?**

**A: NO!** ❌

**Webhooks are PUBLIC URLs, not secrets!**

```
Webhooks go in Meta/Twilio dashboards
NOT in .env file!
```

---

### **Q2: Should I add verify token in Meta?**

**A: YES!** ✅

**Verify token goes in 3 places:**

```
1. ✅ .env file (line 43)
   META_WHATSAPP_VERIFY_TOKEN="704132872732150"

2. ✅ Vercel Dashboard
   Add as environment variable

3. ✅ Meta Dashboard (webhook form)
   Verify Token field: 704132872732150
```

**All 3 must match EXACTLY!** 🔄

---

## 📋 WHAT GOES WHERE:

### **✅ IN .ENV FILE** (Secrets & Configuration):

```env
# Database credentials
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."

# API Keys
OPENAI_API_KEY="sk-proj-..."
META_WHATSAPP_TOKEN="EAAxxxxx..."
META_APP_SECRET="abc123..."

# Configuration
META_WHATSAPP_VERIFY_TOKEN="704132872732150"  ← Goes here!
META_WHATSAPP_PHONE_ID="123456789"
WHATSAPP_PROVIDER="meta"
NEXT_PUBLIC_WHATSAPP_NUMBER="+15556320392"
```

### **✅ IN META DASHBOARD** (Webhook Configuration):

```
Callback URL: https://samia-tarot-app.vercel.app/api/webhook/whatsapp
             ↑ This is a URL, NOT a secret!

Verify Token: 704132872732150
             ↑ This MATCHES .env file!
```

### **❌ NOT IN .ENV** (Public information):

```
❌ Webhook URLs (https://samia-tarot-app.vercel.app/api/webhook/whatsapp)
❌ Domain names (samia-tarot-app.vercel.app)
❌ Phone numbers that are public (+15556320392)
```

---

## 🔑 ENVIRONMENT VARIABLES CHECKLIST:

**Add to Vercel Dashboard:**

```
Required for webhook verification:
☐ META_WHATSAPP_VERIFY_TOKEN = 704132872732150
☐ META_WHATSAPP_PHONE_ID = [from Meta]
☐ META_WHATSAPP_TOKEN = [from Meta]
☐ META_APP_SECRET = [from Meta Settings]

Required for database:
☐ NEXT_PUBLIC_SUPABASE_URL = https://lovvgshqnqqlzbiviate.supabase.co
☐ NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...
☐ SUPABASE_SERVICE_ROLE_KEY = eyJhbGci...
☐ DATABASE_URL = postgresql://postgres.lovvgshqnqqlzbiviate:...

Required for AI:
☐ OPENAI_API_KEY = sk-proj-...

Required for app:
☐ WHATSAPP_PROVIDER = meta
☐ NEXT_PUBLIC_WHATSAPP_PROVIDER = meta
☐ NEXT_PUBLIC_WHATSAPP_NUMBER = +15556320392
☐ ADMIN_PHONE_NUMBER = +9613620860
☐ NEXTAUTH_SECRET = [generate random]
☐ NEXTAUTH_URL = https://samia-tarot-app.vercel.app
```

---

## 📞 WEBHOOK CONFIGURATION:

### **In Meta Dashboard (your screenshot):**

```
┌─────────────────────────────────────────────────┐
│ Callback URL:                                   │
│ https://samia-tarot-app.vercel.app/api/webhook/whatsapp │
│                                                 │
│ Verify Token:                                   │
│ 704132872732150                                │
│                                                 │
│ [Verify and Save]                               │
└─────────────────────────────────────────────────┘
```

**Don't add webhook URL to .env!** ❌

**Only add verify token to .env!** ✅

---

## 🎯 SIMPLE RULES:

### **Secrets (private) → .env file:**
```
✅ API keys
✅ Tokens (access, verify, auth)
✅ Passwords
✅ Database credentials
✅ App secrets
```

### **URLs (public) → Dashboard/Configuration:**
```
✅ Webhook URLs
✅ Domain names
✅ Callback URLs
```

### **Verify Token (special):**
```
✅ Goes in .env (as META_WHATSAPP_VERIFY_TOKEN)
✅ Goes in Meta form (as Verify Token field)
✅ Goes in Vercel env vars (same variable)

Must match in all 3 places! 🔄
```

---

## ✅ YOUR CURRENT STATUS:

```
✅ Vercel: Deployed successfully
✅ Build: Completed (all routes working)
✅ Verify Token: In .env (704132872732150)
✅ Meta Phone: +15556320392
✅ Webhook URL: https://samia-tarot-app.vercel.app/api/webhook/whatsapp

⏳ Next: Add env vars to Vercel dashboard
⏳ Then: Webhook verification will work!
```

---

## 🚀 TO MAKE WEBHOOK WORK:

**3 simple steps:**

**1. Add environment variables in Vercel** (5 min)
   - Visit: https://vercel.com → Project → Settings → Environment Variables
   - Add all variables from your .env file
   - Make sure META_WHATSAPP_VERIFY_TOKEN = 704132872732150

**2. Redeploy** (2 min)
   - Vercel Dashboard → Deployments → Redeploy

**3. Configure webhook in Meta** (1 min)
   - Callback URL: https://samia-tarot-app.vercel.app/api/webhook/whatsapp
   - Verify Token: 704132872732150
   - Click "Verify and Save"
   - Should see ✅ "Verified"!

---

**NABIL! Your build succeeded! Just add environment variables to Vercel, then webhook will work!** 🎉

**Webhook URLs ready:**
- Meta: `https://samia-tarot-app.vercel.app/api/webhook/whatsapp`
- Twilio: `https://samia-tarot-app.vercel.app/api/webhook/whatsapp`
- Stripe: `https://samia-tarot-app.vercel.app/api/webhook/stripe` (create later)

**No other webhooks needed!** ✅

🔮✨🌙