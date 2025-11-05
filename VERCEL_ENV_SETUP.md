# 🚀 VERCEL ENVIRONMENT VARIABLES SETUP

## Step 1: Access Vercel Dashboard

**URL:** https://vercel.com/nabils-projects-447e19b8/samia-tarot-app/settings/environment-variables

---

## 📋 REQUIRED ENVIRONMENT VARIABLES (12 Total)

### Copy and paste each variable below into Vercel:

### 1. Database (Supabase) - 4 variables
**⚠️ Copy values from your local .env file**
```bash
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_supabase_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_supabase_service_role_key>
DATABASE_URL=<your_database_url>
```

### 2. OpenAI - 1 variable
**⚠️ Copy value from your local .env file**
```bash
OPENAI_API_KEY=<your_openai_api_key>
```

### 3. Security & Authentication - 3 variables
**⚠️ Generate NEW secrets for production (recommended):**

Run these commands to generate new secrets:
```bash
openssl rand -base64 32  # Use for NEXTAUTH_SECRET
openssl rand -base64 32  # Use for SESSION_SECRET
openssl rand -base64 32  # Use for ENCRYPTION_MASTER_KEY
```

Then add to Vercel:
```bash
NEXTAUTH_SECRET=<generated_secret_1>
SESSION_SECRET=<generated_secret_2>
ENCRYPTION_MASTER_KEY=<generated_secret_3>
```

### 4. Web Push Notifications - 3 variables
**⚠️ Copy values from your local .env file**
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your_vapid_public_key>
VAPID_PRIVATE_KEY=<your_vapid_private_key>
VAPID_SUBJECT=mailto:<your_email>
```

### 5. Next.js URL - 1 variable
```bash
NEXTAUTH_URL=https://samia-tarot-b6rvg4bkj-nabils-projects-447e19b8.vercel.app
```

---

## 📝 OPTIONAL BUT RECOMMENDED VARIABLES

### WhatsApp (Twilio) - Current provider
**⚠️ Copy values from your local .env file**
```bash
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=<your_twilio_account_sid>
TWILIO_AUTH_TOKEN=<your_twilio_auth_token>
TWILIO_WHATSAPP_NUMBER=<your_whatsapp_number>
```

### WhatsApp (Meta) - Alternative provider
**⚠️ Copy values from your local .env file**
```bash
META_WHATSAPP_PHONE_ID=<your_phone_id>
META_WHATSAPP_TOKEN=<your_meta_token>
META_WHATSAPP_VERIFY_TOKEN=<your_verify_token>
META_APP_SECRET=<your_app_secret>
```

### Google Calendar Integration
**⚠️ Copy values from your local .env file**
```bash
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
GOOGLE_REFRESH_TOKEN=<your_google_refresh_token>
GOOGLE_CALENDAR_ID=<your_calendar_email>
```

### Stripe Payments
**⚠️ Copy values from your local .env file**
```bash
STRIPE_SECRET_KEY=<your_stripe_secret_key>
STRIPE_PUBLISHABLE_KEY=<your_stripe_publishable_key>
STRIPE_WEBHOOK_SECRET=<your_stripe_webhook_secret>
```

### Business Configuration
**⚠️ Customize for your business**
```bash
ADMIN_PHONE_NUMBER=<your_admin_phone>
BUSINESS_NAME=<your_business_name>
BUSINESS_TIMEZONE=<your_timezone>
NEXT_PUBLIC_BASE_URL=https://samia-tarot-b6rvg4bkj-nabils-projects-447e19b8.vercel.app
```

---

## ✅ CHECKLIST

### Step-by-step instructions:

1. **Go to Vercel:**
   - Visit: https://vercel.com/nabils-projects-447e19b8/samia-tarot-app/settings/environment-variables

2. **Add Required Variables (12 minimum):**
   - [ ] NEXT_PUBLIC_SUPABASE_URL
   - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
   - [ ] SUPABASE_SERVICE_ROLE_KEY
   - [ ] DATABASE_URL
   - [ ] OPENAI_API_KEY
   - [ ] NEXTAUTH_SECRET (generate new or use existing)
   - [ ] SESSION_SECRET (generate new or use existing)
   - [ ] ENCRYPTION_MASTER_KEY (generate new or use existing)
   - [ ] NEXT_PUBLIC_VAPID_PUBLIC_KEY
   - [ ] VAPID_PRIVATE_KEY
   - [ ] VAPID_SUBJECT
   - [ ] NEXTAUTH_URL

3. **Add Optional Variables (recommended):**
   - [ ] All WhatsApp credentials (Twilio or Meta)
   - [ ] Google Calendar credentials
   - [ ] Stripe credentials
   - [ ] Business configuration

4. **Set Environment:**
   - Select: **Production, Preview, Development** (all three)

5. **Redeploy:**
   - After adding variables, click "Redeploy" in Vercel dashboard
   - Or push a new commit to trigger automatic deployment

6. **Test:**
   - Wait for deployment to complete (~2 min)
   - Visit: https://samia-tarot-b6rvg4bkj-nabils-projects-447e19b8.vercel.app/login
   - Login: admin@samia-tarot.com / M@ma2009
   - Test features

---

## 🔒 SECURITY NOTES

1. **Generate new secrets for production** (recommended):
   ```bash
   openssl rand -base64 32  # NEXTAUTH_SECRET
   openssl rand -base64 32  # SESSION_SECRET
   openssl rand -base64 32  # ENCRYPTION_MASTER_KEY
   ```

2. **Never commit .env to git** (already in .gitignore)

3. **Rotate tokens periodically:**
   - Meta WhatsApp token: Every 60 days
   - Google OAuth token: If refresh fails
   - Stripe keys: When switching from test to live

4. **Monitor Vercel logs** for any API errors after deployment

---

## 🎯 NEXT STEPS

After adding environment variables:

1. ✅ Wait for automatic redeploy
2. ✅ Test login at /login
3. ✅ Test admin dashboard
4. ✅ Send test WhatsApp message
5. ✅ Book test appointment
6. ✅ Verify Google Calendar integration
7. ✅ Test mobile responsiveness

---

## 📚 DOCUMENTATION

- Full guide: `README.md`
- Token refresh: `docs/REFRESH_TOKENS_GUIDE.md`
- Quick start: `QUICK_START.md`
- Next actions: `NEXT_ACTIONS.md`

---

**Status:** Ready for production deployment!
**Time Estimate:** 10-15 minutes
