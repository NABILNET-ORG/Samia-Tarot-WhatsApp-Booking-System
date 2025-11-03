# ✅ VERCEL ENVIRONMENT VARIABLES - Simple Checklist

## 🎯 WHY WEBHOOK FAILS:

**Vercel doesn't have your environment variables yet!**

Your app can't verify webhooks without these variables.

---

## 📋 COMPLETE CHECKLIST (Copy-Paste Ready!):

**Go to:** https://vercel.com/nabils-projects-447e19b8/samia-tarot-app/settings/environment-variables

**Click "Add New" for each variable below:**

---

### **1. Database (Supabase) - Required** ✅

```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://lovvgshqnqqlzbiviate.supabase.co
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvdnZnc2hxbnFxbHpiaXZpYXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNTQ2ODgsImV4cCI6MjA3NzczMDY4OH0.jJP4tQi2wJch-wXsuwttSDVb_bWBaOs0lOnpgt-z7TU
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvdnZnc2hxbnFxbHpiaXZpYXRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE1NDY4OCwiZXhwIjoyMDc3NzMwNjg4fQ.3z-yUJf9F74p1Jxmd7IC7-nC8fBcoRxxteSRlOnhWMM
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: DATABASE_URL
Value: postgresql://postgres.lovvgshqnqqlzbiviate:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
Environments: ✓ Production ✓ Preview ✓ Development
```

---

### **2. OpenAI - Required** ✅

```
Key: OPENAI_API_KEY
Value: [YOUR KEY FROM .ENV FILE - LINE 19]
Environments: ✓ Production ✓ Preview ✓ Development
```

---

### **3. Meta WhatsApp - Required for Webhook** ✅

```
Key: META_WHATSAPP_VERIFY_TOKEN
Value: samia_tarot_webhook_secret_2025
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: META_WHATSAPP_PHONE_ID
Value: [GET FROM META DASHBOARD - GETTING STARTED PAGE]
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: META_WHATSAPP_TOKEN
Value: [GET FROM META DASHBOARD - GETTING STARTED PAGE]
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: META_APP_SECRET
Value: [GET FROM META SETTINGS → BASIC → APP SECRET]
Environments: ✓ Production ✓ Preview ✓ Development
```

---

### **4. App Configuration - Required** ✅

```
Key: WHATSAPP_PROVIDER
Value: meta
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: NEXT_PUBLIC_WHATSAPP_PROVIDER
Value: meta
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: NEXT_PUBLIC_WHATSAPP_NUMBER
Value: +15556320392
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: ADMIN_PHONE_NUMBER
Value: +9613620860
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: BUSINESS_NAME
Value: Samia Tarot
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: BUSINESS_TIMEZONE
Value: Asia/Beirut
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: NEXTAUTH_SECRET
Value: [GENERATE: openssl rand -base64 32]
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: NEXTAUTH_URL
Value: https://samia-tarot-app.vercel.app
Environments: ✓ Production ✓ Preview ✓ Development
```

---

### **5. NOCARD Countries - Required** ✅

```
Key: NOCARD_COUNTRIES
Value: +213,+20,+964,+961,+218,+212,+963,+216,+967
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: WU_RECEIVER_NAME
Value: Mohamad Nabil Zein
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: WU_RECEIVER_PHONE
Value: +9613620860
Environments: ✓ Production ✓ Preview ✓ Development
```

---

## ⚡ AFTER ADDING ALL VARIABLES:

### **STEP 1: Redeploy**
```
Vercel Dashboard → Deployments → Click "..." → Redeploy
Wait for build to complete (2-3 minutes)
```

### **STEP 2: Try Webhook Verification**
```
Go back to Meta → WhatsApp → Configuration
Click: "Verify and save"

Should see: ✅ "Webhook verified successfully"
```

### **STEP 3: Subscribe to Events**
```
After verification:
☑ messages
Click: "Subscribe"
```

### **STEP 4: Test!**
```
Send WhatsApp message to: +15556320392
Message: "مرحبا"

You should get AI response! 🎉
```

---

## 🎊 SUMMARY:

**What's deployed:**
- ✅ All code fixed
- ✅ Pushed to GitHub
- ✅ Vercel auto-deploying

**What you need to do:**
1. Add environment variables in Vercel (5 min)
2. Redeploy (click button)
3. Verify webhook (click button)
4. Test! (send message)

**Total time:** 10 minutes to fully working system! ⚡

---

**NABIL! Just add those environment variables in Vercel dashboard and everything will work!** 🚀

**File created:** `VERCEL_ENV_SETUP_CHECKLIST.md` (complete list!)

🔮✨🌙