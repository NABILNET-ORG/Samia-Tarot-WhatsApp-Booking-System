# ⚡ Quick Start Guide - 5 Minutes to Running

Get the Samia Tarot WhatsApp booking system running locally in 5 minutes.

---

## 🚀 Super Quick Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your credentials (minimum: DATABASE_URL, OPENAI_API_KEY)

# 3. Set up database
npm run prisma:generate
npm run prisma:migrate

# 4. Run development server
npm run dev
```

**Done!** Visit http://localhost:3000

---

## 🔑 Minimum Required Variables

For basic testing, you only need these in `.env`:

```env
# Database (use local PostgreSQL or free tier)
DATABASE_URL="postgresql://user:password@localhost:5432/samia_tarot"

# OpenAI (get free trial)
OPENAI_API_KEY="sk-proj-..."

# WhatsApp Provider (choose one)
WHATSAPP_PROVIDER="twilio"  # Easier for testing

# Twilio Sandbox (free)
TWILIO_ACCOUNT_SID="ACxxx..."
TWILIO_AUTH_TOKEN="xxx..."
TWILIO_WHATSAPP_NUMBER="+14155238886"

# Admin
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin"
NEXTAUTH_SECRET="any-random-string-here"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 🧪 Test Without WhatsApp

You can test the AI conversation flow without WhatsApp setup:

```bash
# Install dependencies
npm install

# Set up database
npm run prisma:generate
npm run prisma:migrate

# Run dev server
npm run dev
```

Then use the **API test endpoint**:

```bash
curl -X POST http://localhost:3000/api/test/conversation \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "message": "Hello"
  }'
```

---

## 📱 Quick Provider Setup

### Option 1: Twilio (5 minutes)

1. **Sign up**: [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. **Go to WhatsApp Sandbox**: Console → Messaging → Try WhatsApp
3. **Get credentials**:
   - Account SID (from dashboard)
   - Auth Token (from dashboard)
   - Sandbox number: `+14155238886`
4. **Join sandbox**: Send message "join [your-code]" to sandbox number
5. **Add to .env**:
   ```env
   WHATSAPP_PROVIDER="twilio"
   TWILIO_ACCOUNT_SID="ACxxx"
   TWILIO_AUTH_TOKEN="xxx"
   TWILIO_WHATSAPP_NUMBER="+14155238886"
   ```

### Option 2: Meta (20-30 minutes)

1. **Create app**: [developers.facebook.com](https://developers.facebook.com)
2. **Add WhatsApp product**
3. **Get test number** (free)
4. **Copy credentials**:
   ```env
   WHATSAPP_PROVIDER="meta"
   META_WHATSAPP_PHONE_ID="123456789"
   META_WHATSAPP_TOKEN="EAAx..."
   META_WHATSAPP_VERIFY_TOKEN="your-secret"
   META_APP_SECRET="abc123"
   ```

---

## 🗄️ Quick Database Options

### Option 1: Local PostgreSQL

```bash
# macOS (Homebrew)
brew install postgresql
brew services start postgresql
createdb samia_tarot

# Ubuntu/Debian
sudo apt install postgresql
sudo -u postgres createdb samia_tarot

# DATABASE_URL
DATABASE_URL="postgresql://localhost:5432/samia_tarot"
```

### Option 2: Free Cloud Database

**Railway** (free $5 credit):
```bash
npm install -g @railway/cli
railway login
railway init
railway add postgresql
railway variables  # Copy DATABASE_URL
```

**Supabase** (free tier):
1. [supabase.com](https://supabase.com) → New Project
2. Settings → Database → Connection String
3. Copy and use in .env

---

## 🧪 Testing Checklist

Once running, test these features:

### 1. Database Connection
```bash
npm run prisma:studio
# Should open http://localhost:5555 with database viewer
```

### 2. AI Conversation (No WhatsApp needed)
```bash
curl -X POST http://localhost:3000/api/test/conversation \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "message": "مرحبا"
  }'
```

### 3. Admin Dashboard
- Visit: http://localhost:3000/admin
- Login: `admin` / `admin` (from .env)
- Should see dashboard

### 4. PWA Manifest
- Visit: http://localhost:3000/manifest.json
- Should return JSON

### 5. WhatsApp Webhook (if configured)
```bash
# Use ngrok to expose localhost
npx ngrok http 3000
# Copy HTTPS URL to WhatsApp webhook config
# Send test message to your WhatsApp number
```

---

## 🐛 Common Quick Fixes

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
psql $DATABASE_URL

# Or use free cloud database instead (Railway/Supabase)
```

### "OpenAI API error"
```bash
# Check API key is valid
# Check you have credits: platform.openai.com/account/billing
```

### "Prisma client not generated"
```bash
npm run prisma:generate
```

### "Port 3000 already in use"
```bash
# Kill process using port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

---

## 📚 Next Steps

After quick start:

1. **Read full README**: `README.md` for complete features
2. **Configure all APIs**: Stripe, Google Calendar, etc.
3. **Deploy to production**: Follow `DEPLOYMENT.md`
4. **Customize branding**: Edit colors in `tailwind.config.ts`

---

## 🎯 Production-Ready Checklist

Before going live:

- [ ] Use production database (not local)
- [ ] Get production API keys (Stripe, OpenAI, etc.)
- [ ] Set up WhatsApp business account (verified)
- [ ] Configure webhooks with HTTPS domain
- [ ] Enable HTTPS/SSL
- [ ] Change admin password
- [ ] Test payment flow end-to-end
- [ ] Set up monitoring (Sentry, logs)
- [ ] Create database backups

---

## 💡 Tips

- **Free Testing**: Use Twilio sandbox + local PostgreSQL + OpenAI free trial
- **Quick Deploy**: Use Vercel (free) + Railway database (free $5 credit)
- **Skip WhatsApp**: Test AI with curl commands first
- **Debug**: Check Prisma Studio (`npm run prisma:studio`) for data

---

## 🆘 Help

**Stuck?** Check:
1. Console logs in terminal
2. Browser console (F12)
3. Database: `npm run prisma:studio`
4. Troubleshooting in `README.md`

**Still stuck?** All dependencies should work out of the box with Node.js 18+.

---

**Happy Building! 🔮✨**

Get started in 5 minutes, customize in hours, deploy in a day!
