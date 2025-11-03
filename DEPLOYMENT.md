# 🚀 Deployment Guide - Samia Tarot App

Complete step-by-step guide to deploy your WhatsApp booking system to production.

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] PostgreSQL database (Railway/Supabase/Heroku)
- [ ] OpenAI API key
- [ ] Stripe account (production keys)
- [ ] Google Cloud project (Calendar + Contacts APIs)
- [ ] WhatsApp provider account (Meta OR Twilio)
- [ ] Domain name (optional but recommended)
- [ ] SSL certificate (automatic with Vercel/Railway)

---

## 🗄️ Step 1: Database Setup

### Option A: Railway (Recommended - Free $5/month credit)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create PostgreSQL Database**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login
   railway login

   # Create new project
   railway init

   # Add PostgreSQL
   railway add postgresql
   ```

3. **Get Database URL**
   ```bash
   # View connection string
   railway variables
   # Copy DATABASE_URL value
   ```

### Option B: Supabase (Free tier)

1. Go to [supabase.com](https://supabase.com)
2. Create project
3. Go to Settings → Database → Connection String
4. Copy URI (use "Transaction" mode)

### Option C: Heroku Postgres

1. Create Heroku app
2. Add Heroku Postgres addon
3. Get `DATABASE_URL` from config vars

---

## ⚙️ Step 2: Environment Variables

Create `.env.production` file:

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-domain.com"

# Admin
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="strong-password-here"

# WhatsApp Provider (choose one)
WHATSAPP_PROVIDER="meta"  # or "twilio"

# If using Meta
META_WHATSAPP_PHONE_ID="123456789"
META_WHATSAPP_TOKEN="EAAx..."
META_WHATSAPP_VERIFY_TOKEN="your-secret-token"
META_APP_SECRET="abc123..."

# If using Twilio
TWILIO_ACCOUNT_SID="ACxxx"
TWILIO_AUTH_TOKEN="xxx"
TWILIO_WHATSAPP_NUMBER="+14155238886"

# OpenAI
OPENAI_API_KEY="sk-proj-xxx"

# Stripe (production keys!)
STRIPE_SECRET_KEY="sk_live_xxx"
STRIPE_PUBLISHABLE_KEY="pk_live_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"

# Google
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"
GOOGLE_REFRESH_TOKEN="1//xxx"

# Business
ADMIN_PHONE_NUMBER="+9613620860"
BUSINESS_NAME="Samia Tarot"
BUSINESS_TIMEZONE="Asia/Beirut"

# Western Union
WU_RECEIVER_NAME="Mohamad Nabil Zein"
WU_RECEIVER_PHONE="+9613620860"
WU_RECEIVER_COUNTRY="Lebanon"
WU_CURRENCY="USD"

# Base URL
NEXT_PUBLIC_BASE_URL="https://your-domain.com"
```

---

## 🔑 Step 3: Obtain API Keys

### OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create account / Sign in
3. Go to API Keys → Create new key
4. Copy key (starts with `sk-proj-...`)
5. Add $5+ credits to your account

### Stripe Keys (Production)

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Complete business verification
3. Toggle "Test mode" OFF
4. Go to Developers → API Keys
5. Copy "Secret key" (`sk_live_...`)
6. Copy "Publishable key" (`pk_live_...`)

### Google APIs

#### Step 3.1: Create Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project: "Samia Tarot"
3. Enable APIs:
   - Google Calendar API
   - Google People API (Contacts)

#### Step 3.2: Create OAuth Credentials

1. Go to APIs & Services → Credentials
2. Create OAuth 2.0 Client ID
3. Application type: "Web application"
4. Authorized redirect URIs: `https://developers.google.com/oauthplayground`
5. Copy Client ID and Client Secret

#### Step 3.3: Get Refresh Token

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
2. Click settings (⚙️) → Use your own OAuth credentials
3. Enter your Client ID and Secret
4. Select scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/contacts`
5. Authorize APIs
6. Exchange authorization code for tokens
7. Copy "Refresh token"

### WhatsApp Provider

#### Option A: Meta WhatsApp Business API

**Prerequisites:**
- Facebook Business Manager account
- Verified business
- Phone number to use

**Steps:**

1. **Create Meta App**
   - Go to [developers.facebook.com](https://developers.facebook.com)
   - Create App → Business → WhatsApp

2. **Set Up WhatsApp**
   - Add WhatsApp product
   - Add phone number
   - Complete business verification

3. **Get Credentials**
   - Phone Number ID: WhatsApp → Getting Started
   - Access Token: WhatsApp → Getting Started (temporary - get permanent one from System Users)
   - App Secret: Settings → Basic → App Secret
   - Verify Token: Create your own random string

4. **System User Token (Permanent)**
   - Business Settings → System Users
   - Create system user
   - Assign to app
   - Generate token with `whatsapp_business_messaging` permission

#### Option B: Twilio (Easier Setup)

1. **Create Twilio Account**
   - Go to [twilio.com/console](https://www.twilio.com/console)
   - Sign up

2. **Get Sandbox Number**
   - Go to Messaging → Try WhatsApp
   - Join sandbox: Send "join [code]" to Twilio number
   - Copy sandbox number (e.g., `+14155238886`)

3. **Get Credentials**
   - Account SID: From Console Dashboard
   - Auth Token: From Console Dashboard

4. **For Production (Requires Approval)**
   - Go to Messaging → Senders → WhatsApp Senders
   - Request WhatsApp sender
   - Complete business verification (~2 weeks)

---

## 🚀 Step 4: Deploy Application

### Option A: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Build Database**
   ```bash
   # Run migrations
   npm run prisma:migrate
   ```

3. **Deploy**
   ```bash
   # Login
   vercel login

   # Deploy to production
   vercel --prod
   ```

4. **Set Environment Variables**
   - Go to [vercel.com](https://vercel.com) → Project → Settings → Environment Variables
   - Add all variables from `.env.production`
   - Redeploy: `vercel --prod`

5. **Run Database Migration on Vercel**
   ```bash
   # SSH into Vercel (if needed) or run locally with production DATABASE_URL
   DATABASE_URL="your-vercel-postgres-url" npm run prisma:migrate
   ```

### Option B: Railway

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Initialize Project**
   ```bash
   railway init
   railway link
   ```

3. **Add Service**
   ```bash
   # Add Next.js service
   railway up
   ```

4. **Set Environment Variables**
   ```bash
   # Via CLI
   railway variables set KEY=value

   # Or via dashboard: railway.app
   ```

5. **Deploy**
   ```bash
   railway up
   ```

### Option C: Manual VPS (DigitalOcean/AWS/etc.)

1. **Provision Server**
   - Ubuntu 22.04 LTS
   - At least 1GB RAM
   - Node.js 18+ installed

2. **Clone & Build**
   ```bash
   git clone <your-repo>
   cd samia-tarot-app
   npm install
   npm run build
   ```

3. **Set Up PM2**
   ```bash
   npm install -g pm2
   pm2 start npm --name "samia-tarot" -- start
   pm2 save
   pm2 startup
   ```

4. **Configure Nginx**
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;

     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

5. **SSL with Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## 🔗 Step 5: Configure Webhooks

### Meta WhatsApp Webhook

1. **Go to Meta App Dashboard**
   - Developers.facebook.com → Your App → WhatsApp → Configuration

2. **Set Webhook URL**
   ```
   https://your-domain.com/api/webhook/whatsapp
   ```

3. **Set Verify Token**
   - Use value from `META_WHATSAPP_VERIFY_TOKEN` in .env

4. **Subscribe to Events**
   - Check: `messages`
   - Click "Verify and Save"

5. **Test**
   - Send message to your WhatsApp number
   - Check Vercel logs or Railway logs

### Twilio WhatsApp Webhook

1. **Go to Twilio Console**
   - Messaging → Senders → WhatsApp Senders

2. **Configure Sandbox (or approved sender)**
   - When a message comes in: `https://your-domain.com/api/webhook/whatsapp`
   - HTTP Method: `POST`

3. **Test**
   - Send message to sandbox number
   - Check logs

### Stripe Webhook

1. **Go to Stripe Dashboard**
   - Developers → Webhooks → Add endpoint

2. **Set Endpoint URL**
   ```
   https://your-domain.com/api/webhook/stripe
   ```

3. **Select Events**
   - `checkout.session.completed`
   - `payment_intent.succeeded`

4. **Copy Webhook Secret**
   - Starts with `whsec_...`
   - Add to `STRIPE_WEBHOOK_SECRET` in env vars

---

## 🧪 Step 6: Test Production

### Test WhatsApp Flow

1. Send message to your WhatsApp business number
2. Verify:
   - [ ] AI responds correctly
   - [ ] Language detection works
   - [ ] Service menu displays
   - [ ] Conversation saved to database

### Test Payment Flow

1. Select a service
2. Provide name/email
3. Complete Stripe checkout
4. Verify:
   - [ ] Payment succeeds
   - [ ] Webhook received
   - [ ] Booking created in database
   - [ ] Confirmation sent via WhatsApp
   - [ ] Admin notification received

### Test Admin Dashboard

1. Visit `https://your-domain.com/admin`
2. Login with `ADMIN_USERNAME` and `ADMIN_PASSWORD`
3. Verify:
   - [ ] Stats display correctly
   - [ ] Can view bookings
   - [ ] Can view conversations
   - [ ] Provider switcher works

---

## 📱 Step 7: PWA Installation

### Test on Mobile

1. **iOS**
   - Open Safari
   - Visit your site
   - Tap Share → Add to Home Screen
   - Verify app icon appears

2. **Android**
   - Open Chrome
   - Visit your site
   - Tap "Add to Home Screen" prompt
   - Verify app installs

3. **Desktop**
   - Open Chrome/Edge
   - Look for install icon in address bar
   - Click "Install"

---

## 🤖 Step 8: Create Android App (Optional)

### Using Trusted Web Activity (TWA)

1. **Install Bubblewrap**
   ```bash
   npm install -g @bubblewrap/cli
   ```

2. **Initialize TWA**
   ```bash
   bubblewrap init --manifest https://your-domain.com/manifest.json
   ```

3. **Build APK**
   ```bash
   bubblewrap build
   ```

4. **Upload to Google Play**
   - Create Google Play Developer account ($25 one-time)
   - Upload APK from `./app-release-signed.apk`
   - Complete store listing
   - Submit for review

---

## 🔍 Step 9: Monitoring & Logs

### Vercel Logs

```bash
# View real-time logs
vercel logs --follow

# View last 100 logs
vercel logs
```

### Railway Logs

```bash
# View logs
railway logs

# Or via dashboard
```

### Database Monitoring

```bash
# Open Prisma Studio
npm run prisma:studio
```

### Set Up Sentry (Error Tracking)

1. Create account at [sentry.io](https://sentry.io)
2. Install Sentry:
   ```bash
   npm install @sentry/nextjs
   ```
3. Initialize:
   ```bash
   npx @sentry/wizard -i nextjs
   ```
4. Add DSN to environment variables

---

## 🔒 Step 10: Security Hardening

### Rate Limiting

Add to `src/middleware.ts`:
```typescript
import { rateLimiter } from './lib/rate-limiter'

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? 'anonymous'
  const { success } = await rateLimiter.limit(ip)

  if (!success) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }
}
```

### Environment Variable Validation

Add to `src/lib/env.ts`:
```typescript
export function validateEnv() {
  const required = [
    'DATABASE_URL',
    'OPENAI_API_KEY',
    'STRIPE_SECRET_KEY',
    'WHATSAPP_PROVIDER'
  ]

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`)
    }
  }
}
```

### HTTPS Only

Add to `next.config.js`:
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        }
      ]
    }
  ]
}
```

---

## 📊 Step 11: Analytics (Optional)

### Google Analytics

1. Create GA4 property
2. Install package:
   ```bash
   npm install @next/third-parties
   ```
3. Add to `layout.tsx`:
   ```tsx
   import { GoogleAnalytics } from '@next/third-parties/google'

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <GoogleAnalytics gaId="G-XXXXXXXXXX" />
         </body>
       </html>
     )
   }
   ```

---

## 🎉 Step 12: Go Live!

### Final Checklist

- [ ] All environment variables set
- [ ] Database migrations complete
- [ ] WhatsApp webhooks configured and tested
- [ ] Stripe webhooks configured and tested
- [ ] Admin dashboard accessible
- [ ] PWA installable on mobile
- [ ] SSL certificate active
- [ ] Error tracking configured
- [ ] Backup strategy in place

### Announce Launch

1. Update WhatsApp Business profile
2. Send announcement to existing customers
3. Add booking link to social media
4. Test with real customers

---

## 🔄 Maintenance

### Database Backups

**Railway:**
```bash
# Automatic daily backups included
```

**Manual backup:**
```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update all
npm update

# Update Next.js
npm install next@latest

# Update Prisma
npm install prisma@latest @prisma/client@latest
npx prisma generate
```

### Monitor Costs

- **OpenAI**: ~$0.002 per conversation (GPT-4)
- **Stripe**: 2.9% + $0.30 per transaction
- **Vercel**: Free for hobby, $20/month Pro
- **Railway**: $5/month credit, ~$10-20/month total
- **Twilio**: ~$0.005 per message

---

## 🆘 Troubleshooting

### Webhooks Not Working

```bash
# Test webhook locally with ngrok
ngrok http 3000

# Check webhook logs
# Vercel: vercel logs --follow
# Railway: railway logs

# Check database
npm run prisma:studio
# Look at WebhookLog table
```

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL

# Check SSL mode
DATABASE_URL="...?sslmode=require"
```

### Build Failures

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

---

## 📞 Support

If you encounter issues:

1. Check logs (Vercel/Railway dashboard)
2. Review `WebhookLog` table in database
3. Test webhooks with ngrok locally
4. Verify all environment variables
5. Check API quotas (OpenAI, Stripe, Google)

---

**Deployment Complete! 🎊**

Your Samia Tarot booking system is now live and ready to serve customers!

🔮✨🌙
