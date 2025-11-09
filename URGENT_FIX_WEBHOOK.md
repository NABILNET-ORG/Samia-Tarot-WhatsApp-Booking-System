# 🚨 URGENT: Fix WhatsApp Webhook Issue

**Problem:** Bot receives "hi" but doesn't respond
**Cause:** INTERNAL_API_KEY not set in Vercel production
**Solution:** Add the environment variable NOW

---

## 🔥 IMMEDIATE FIX (5 minutes)

### Step 1: Add INTERNAL_API_KEY to Vercel

**Go to:** https://vercel.com/dashboard

1. Select your project: "samia-tarot-app"
2. Click: **Settings**
3. Click: **Environment Variables**
4. Click: **Add New**
5. Enter:
   ```
   Name: INTERNAL_API_KEY
   Value: wh_internal_mhrpg5ij_d4051a723da69858786e4c8769a98d9fd91b5358309e53b7207efe732af68546
   ```
6. Select: ✅ Production, ✅ Preview, ✅ Development
7. Click: **Save**
8. **IMPORTANT:** Click **Redeploy** (Vercel will show a button)

**Wait 2-3 minutes for redeployment**

---

## 🔍 WHAT'S HAPPENING

**Current Flow:**
1. ✅ WhatsApp receives "hi" from customer
2. ✅ Webhook arrives at `/api/webhook/whatsapp`
3. ✅ Webhook finds business by phone
4. ❌ **FAILS HERE:** Calls `/api/webhook/process-message` with invalid API key
5. ❌ AI processing never happens
6. ❌ No response sent back to customer

**Error:**
The webhook processor rejects the request with:
```
403 Forbidden - Invalid internal API key
```

---

## ✅ AFTER ADDING THE KEY

**Flow will work:**
1. ✅ WhatsApp receives message
2. ✅ Webhook validates signature
3. ✅ Finds business
4. ✅ **NOW WORKS:** Calls processor with valid key
5. ✅ AI processes message
6. ✅ Response sent to customer

---

## 📋 ALSO ADD WHILE YOU'RE THERE

**META_APP_SECRET** (for webhook security):
```
Name: META_APP_SECRET
Value: 8cefc0e397cc1b3fbc9f981061a88269
Environments: ✅ All
```

**META_WHATSAPP_TOKEN** (updated token from .env):
```
Name: META_WHATSAPP_TOKEN
Value: EAAKAZA7XAZCfYBPyKYf6DYXvXScyPR4BZA40MfZAYOmkFxzz1tQi4ZCfRa2Tf6KHxICWGpWnXGtfHZBeCjdnNHSXgZAZBdXZCjaphM3N5tn7Y7rZCO69cfSAMig7tIsZBd1ZCdoQHwr6QxtCXg0OJa5H5LeZBZBuyhsa0RezESRwXb20HlbueMltLR5ZAMplP9A4b8BM9QMsBtbBlnJ6BnfhPN90Mb4EGKZBOdHTnhdpo8QpJZCZCCUIDYOSzNgMSkTbm3iZBssvTfQvtjmWo92lhgTsCSRWkm5BLqrEEXLyB5GA5wZD
Environments: ✅ All
```

---

## 🧪 TEST AFTER REDEPLOYMENT

**Wait for Vercel to finish redeployment (2-3 min)**

Then test:
1. Send "hello" from WhatsApp to your business number
2. Should receive AI response within 5-10 seconds
3. Check dashboard - should see the conversation

---

## 🐛 IF STILL NOT WORKING

### Check Vercel Runtime Logs:
1. Vercel Dashboard → Project
2. Click latest deployment
3. Click: **Runtime Logs**
4. Look for errors in red

### Common Issues:
- Missing INTERNAL_API_KEY → Add it
- Wrong META_WHATSAPP_PHONE_ID → Verify in Vercel
- Wrong META_WHATSAPP_TOKEN → Update in Vercel
- Database not connected → Check DATABASE_URL

---

## 📞 QUICK CHECKLIST

**Required Vercel Environment Variables:**

✅ **Server Keys:**
- [ ] INTERNAL_API_KEY (NEW - must add!)
- [ ] META_APP_SECRET
- [ ] DATABASE_URL
- [ ] NEXTAUTH_SECRET
- [ ] SESSION_SECRET
- [ ] ENCRYPTION_MASTER_KEY

✅ **WhatsApp:**
- [ ] META_WHATSAPP_TOKEN (updated token!)
- [ ] META_WHATSAPP_PHONE_ID
- [ ] META_WHATSAPP_VERIFY_TOKEN

✅ **OpenAI:**
- [ ] OPENAI_API_KEY

✅ **Supabase:**
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY

---

## 🎯 BOTTOM LINE

**The webhook is failing because INTERNAL_API_KEY is missing in Vercel.**

**Fix:** Add the key → Redeploy → Test

**Time:** 5 minutes to fix, 3 minutes to redeploy, 1 minute to test

**Total:** 9 minutes to working bot! 🤖

---

**DO IT NOW!** Then test by sending a WhatsApp message.
