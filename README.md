# 🔮 Samia Tarot Booking System - Full Stack PWA

![Version](https://img.shields.io/badge/version-2.0.0-purple)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![PWA](https://img.shields.io/badge/PWA-Ready-green)

A complete, production-ready WhatsApp booking system for Samia Tarot with AI-powered conversations, flexible provider support (Meta/Twilio), and mobile-first PWA design.

---

## ✨ Key Features

### 🤖 AI-Powered Conversations
- **GPT-4 Integration**: Intelligent conversation management with context awareness
- **Conversation Memory**: Maintains full conversation history for natural interactions
- **Smart Q&A**: Answers general questions about services, pricing, and availability
- **Bilingual Support**: Seamless Arabic & English conversations

### 📱 WhatsApp Provider Flexibility
- **Choose Your Provider**: Switch between Meta WhatsApp Business API or Twilio
- **Unified Interface**: Single API abstraction layer for both providers
- **Easy Migration**: Change providers without modifying business logic
- **Provider-Specific Features**: Leverages unique capabilities of each platform

### 💬 Advanced Booking System
- **13 Spiritual Services**: Coffee Cup, Tarot, Rune readings + Direct calls
- **Smart Scheduling**: Tier-based delivery (Standard, Premium, Golden)
- **Real-time Calendar Integration**: Google Calendar for appointments
- **Contact Management**: Auto-save to Google Contacts
- **Payment Processing**: Stripe + Western Union for MENA countries

### 📲 Mobile-First PWA
- **Progressive Web App**: Install on any device (iOS/Android/Desktop)
- **Offline Capable**: Service workers for offline functionality
- **Fast & Responsive**: Optimized for mobile networks
- **Native Feel**: App-like experience with splash screens
- **Android TWA Ready**: Can be wrapped as Android app

### 🎛️ Admin Dashboard
- **Provider Switcher**: One-click provider change (Meta ↔ Twilio)
- **Real-time Stats**: Bookings, conversations, payments
- **Conversation Viewer**: Monitor active customer chats
- **Booking Management**: View and manage all appointments
- **System Configuration**: Centralized settings management

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 14 App Router                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │  PWA Client  │◄────►│  Admin Panel │◄────►│   APIs    │ │
│  │  (Mobile)    │      │  (Dashboard) │      │  Routes   │ │
│  └──────────────┘      └──────────────┘      └─────┬─────┘ │
│                                                      │        │
├──────────────────────────────────────────────────────┼───────┤
│                    Backend Services                  │        │
│                                                      ▼        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         WhatsApp Provider Abstraction Layer         │    │
│  │  ┌────────────────┐         ┌────────────────┐    │    │
│  │  │  Meta Provider │   OR    │ Twilio Provider│    │    │
│  │  └────────────────┘         └────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   OpenAI     │  │   Stripe     │  │   Google     │      │
│  │   GPT-4      │  │   Payments   │  │   APIs       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │          PostgreSQL Database (Prisma ORM)            │    │
│  │  ├─ Customers     ├─ Conversations  ├─ Bookings    │    │
│  │  ├─ Services      ├─ Messages       ├─ Webhooks    │    │
│  └─────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **PostgreSQL** database
- **OpenAI API** key
- **Stripe** account (test mode)
- **Google Cloud** project (Calendar + Contacts APIs)
- **WhatsApp Provider** account:
  - **Option A**: Meta WhatsApp Business API (requires business verification)
  - **Option B**: Twilio account (easier setup)

### 1. Clone & Install

```bash
git clone <repository-url>
cd samia-tarot-app
npm install
```

### 2. Database Setup

```bash
# Copy environment variables
cp .env.example .env

# Edit .env with your database URL
# DATABASE_URL="postgresql://user:password@localhost:5432/samia_tarot"

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### 3. Configure Environment Variables

Edit `.env` file:

```env
# Choose your WhatsApp provider
WHATSAPP_PROVIDER="meta"  # or "twilio"

# If using Meta:
META_WHATSAPP_PHONE_ID="your-phone-id"
META_WHATSAPP_TOKEN="your-access-token"
META_WHATSAPP_VERIFY_TOKEN="your-verify-token"
META_APP_SECRET="your-app-secret"

# If using Twilio:
TWILIO_ACCOUNT_SID="your-sid"
TWILIO_AUTH_TOKEN="your-token"
TWILIO_WHATSAPP_NUMBER="+14155238886"

# Required for all:
OPENAI_API_KEY="sk-..."
STRIPE_SECRET_KEY="sk_test_..."
# ... (see .env.example for full list)
```

### 4. Run Development Server

```bash
npm run dev
```

Visit:
- **Customer PWA**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin

### 5. Set Up Webhooks

#### For Meta WhatsApp:
1. Go to Meta Developer Console
2. Configure webhook URL: `https://your-domain.com/api/webhook/whatsapp`
3. Use your `META_WHATSAPP_VERIFY_TOKEN`
4. Subscribe to `messages` events

#### For Twilio:
1. Go to Twilio Console → WhatsApp Senders
2. Set webhook URL: `https://your-domain.com/api/webhook/whatsapp`
3. Method: `POST`

---

## 📱 WhatsApp Provider Comparison

| Feature | Meta WhatsApp Business | Twilio |
|---------|----------------------|--------|
| **Setup Difficulty** | Hard (requires business verification) | Easy (instant sandbox) |
| **Pricing** | Free tier available | Pay per message |
| **Interactive Messages** | ✅ Yes (buttons, lists) | ✅ Yes |
| **Message Templates** | ✅ Pre-approved templates | ✅ Pre-approved templates |
| **Business Verification** | Required for production | Not required |
| **API Quality** | Official Meta API | Third-party (reliable) |
| **Best For** | Large businesses, official branding | Developers, quick prototypes |

### Switching Providers

**Via Environment Variable** (before deployment):
```env
WHATSAPP_PROVIDER="twilio"  # Change to "meta" or "twilio"
```

**Via Admin Dashboard** (runtime):
1. Login to `/admin`
2. Click on desired provider card
3. System automatically switches

---

## 🎨 PWA Features

### Mobile Installation

**iOS (Safari)**:
1. Open site in Safari
2. Tap Share icon
3. "Add to Home Screen"

**Android (Chrome)**:
1. Open site in Chrome
2. Tap menu (⋮)
3. "Add to Home Screen" or "Install App"

**Desktop (Chrome/Edge)**:
1. Look for install icon in address bar
2. Click "Install"

### Offline Support
- Service worker caches static assets
- Admin dashboard works offline
- Conversation history cached locally
- Automatic sync when online

### Android TWA (Trusted Web Activity)

To create Android app:

1. Install Android Studio
2. Create TWA project:
```bash
npx @bubblewrap/cli init --manifest https://your-domain.com/manifest.json
npx @bubblewrap/cli build
```
3. Upload to Google Play Store

---

## 🗄️ Database Schema

```prisma
model Customer {
  phoneNumber   String    @unique
  nameAr        String?
  nameEn        String?
  email         String?
  language      String    // "ar" or "en"
  bookings      Booking[]
  conversations Conversation[]
}

model Conversation {
  customer   Customer
  state      String    // GREETING, SHOW_SERVICES, etc.
  language   String
  active     Boolean
  messages   ConversationMessage[]
}

model Booking {
  customer          Customer
  service           Service
  status            String  // pending, confirmed, completed
  paymentStatus     String  // unpaid, paid, refunded
  scheduledAt       DateTime?
  googleCalendarId  String?
}

// + Service, ConversationMessage, Notification, WebhookLog
```

---

## 🔌 API Endpoints

### Webhooks
- `POST /api/webhook/whatsapp` - Receive WhatsApp messages (Meta/Twilio)
- `POST /api/webhook/stripe` - Stripe payment events
- `GET /api/webhook/whatsapp` - Meta webhook verification

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `POST /api/admin/provider` - Switch WhatsApp provider
- `GET /api/admin/bookings` - List all bookings
- `GET /api/admin/conversations` - Active conversations

### Customer (Internal)
- `POST /api/customer/create` - Create customer record
- `GET /api/customer/:phone` - Get customer info

---

## 🎯 Conversation Flow

```
1. Customer → WhatsApp Message
   ↓
2. Webhook → Parse Message (Meta/Twilio)
   ↓
3. Get/Create Customer + Conversation
   ↓
4. Load Conversation History (last 10 turns)
   ↓
5. Send to GPT-4 with Context
   ↓
6. AI Analyzes → Returns State + Response
   ↓
7. Save Message to Database
   ↓
8. Send Response via WhatsApp
   ↓
9. Handle State Actions (payment, calendar, etc.)
```

---

## 💳 Payment Integration

### Stripe Checkout
```typescript
// Auto-generated for international customers
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{
    price_data: {
      currency: 'usd',
      product_data: { name: serviceName },
      unit_amount: price * 100
    },
    quantity: 1
  }],
  mode: 'payment',
  success_url: `${baseUrl}/success`,
  cancel_url: `${baseUrl}/cancel`,
  metadata: { customerId, serviceId }
})
```

### Western Union (MENA Countries)
- Detect country from phone prefix (+961, +963, etc.)
- Send WU instructions via WhatsApp
- Customer provides MTCN (Money Transfer Control Number)
- Admin confirms payment manually

---

## 📅 Google Calendar Integration

### For Reading Services
- Creates "task" event at delivery time (10 PM)
- Title: "Deliver [Service Name] to [Customer]"
- Reminder: 1 hour before

### For Call Services
- Checks availability (12 PM - 8 PM)
- Calculates free slots with 30-min buffer
- Creates calendar event with Google Meet link
- Sends link to customer via WhatsApp

---

## 🌍 Internationalization

### Language Detection
1. User selects 1 (Arabic) or 2 (English)
2. Auto-detect Arabic characters: `[؀-ۿ]`
3. Keyword matching: "عربي", "Arabic"

### Bilingual Content
- Service names stored in both languages
- All UI text has Arabic/English versions
- Admin dashboard in English
- Customer messages in their language

### Text Direction
```css
.rtl {
  direction: rtl;
  font-family: var(--font-cairo);
}
```

---

## 🛠️ Development

### Project Structure
```
samia-tarot-app/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/
│   ├── manifest.json          # PWA manifest
│   └── icons/                 # App icons
├── src/
│   ├── app/
│   │   ├── admin/             # Admin dashboard
│   │   ├── api/               # API routes
│   │   │   └── webhook/       # Webhook handlers
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── lib/
│   │   ├── whatsapp/          # Provider abstraction
│   │   │   ├── provider.interface.ts
│   │   │   ├── meta-provider.ts
│   │   │   ├── twilio-provider.ts
│   │   │   └── factory.ts
│   │   ├── ai/
│   │   │   └── conversation-manager.ts
│   │   ├── google/
│   │   │   ├── calendar.ts
│   │   │   └── contacts.ts
│   │   └── stripe/
│   │       └── checkout.ts
│   └── components/            # React components
├── .env.example               # Environment template
├── next.config.js             # Next.js + PWA config
├── tailwind.config.ts         # Tailwind CSS
└── tsconfig.json              # TypeScript config
```

### Adding New Services

1. Edit `src/lib/ai/conversation-manager.ts`:
```typescript
const SERVICES = [
  // ... existing services
  {
    id: 14,
    nameAr: 'خدمة جديدة',
    nameEn: 'New Service',
    price: 150,
    type: 'reading',
    tier: 'premium'
  }
]
```

2. Update database (optional):
```bash
npm run prisma:studio
# Manually add to Service table
```

### Custom AI Prompts

Edit `SYSTEM_PROMPT` in `src/lib/ai/conversation-manager.ts`:
```typescript
const SYSTEM_PROMPT = `You are Samia Tarot's assistant...

**NEW RULE:**
- Always mention current promotions
- Offer discount codes for returning customers
`
```

---

## 🧪 Testing

### Test Webhooks Locally

Use **ngrok** for local webhook testing:

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Copy HTTPS URL to Meta/Twilio webhook config
# Example: https://abc123.ngrok.io/api/webhook/whatsapp
```

### Test WhatsApp Messages

1. Send test message to your WhatsApp Business number
2. Check logs: `console.log` in `/api/webhook/whatsapp/route.ts`
3. Verify database: `npm run prisma:studio`

### Test Payment Flow

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- CVV: Any 3 digits
- Expiry: Any future date

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# vercel.com → Project → Settings → Environment Variables
```

### Railway (Database + Backend)

1. Create Railway project
2. Add PostgreSQL database
3. Deploy Next.js app
4. Set environment variables
5. Update `DATABASE_URL` in `.env`

### Manual Deployment

```bash
# Build
npm run build

# Start production server
npm start
```

---

## 📊 Monitoring & Analytics

### Built-in Logging
- All webhooks logged to `WebhookLog` table
- Conversation messages stored for history
- Payment events tracked in `Booking`

### Recommended Tools
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Google Analytics**: User behavior
- **Stripe Dashboard**: Payment analytics

---

## 🔒 Security

### Best Practices
✅ Webhook signature verification (Meta & Twilio)
✅ Environment variables for secrets
✅ HTTPS required for production
✅ Rate limiting on API routes
✅ Input sanitization for AI prompts
✅ Admin authentication with NextAuth
✅ Database credentials in secure vault

### Admin Access

Protected routes in `src/middleware.ts`:
```typescript
export const config = {
  matcher: ['/admin/:path*']
}
```

Login required for `/admin/*` pages.

---

## 🐛 Troubleshooting

### Issue: WhatsApp messages not received

**Check:**
1. Webhook URL is publicly accessible (use ngrok for local)
2. Webhook verification passed (for Meta)
3. `WebhookLog` table for error messages
4. Provider credentials are correct

### Issue: AI responses are slow

**Solutions:**
- Reduce `max_tokens` in GPT-4 call
- Use GPT-3.5-turbo instead of GPT-4
- Cache common responses
- Implement timeout handling

### Issue: PWA not installing

**Check:**
1. Site served over HTTPS
2. `manifest.json` accessible
3. Icons exist in `/public`
4. Service worker registered
5. No console errors

### Issue: Provider switch not working

**Debug:**
```typescript
// Check current provider
const provider = getWhatsAppProvider()
console.log(provider.getName()) // "meta" or "twilio"

// Reset provider instance
resetWhatsAppProvider()
```

---

## 🎨 Customization

### Branding
- Edit colors in `tailwind.config.ts`
- Replace icons in `/public`
- Update `manifest.json` name/description
- Modify theme in `src/app/globals.css`

### Features to Add
- [ ] Voice message support
- [ ] Image analysis (cup photos before booking)
- [ ] Customer reviews system
- [ ] Loyalty points
- [ ] Multi-admin support
- [ ] WhatsApp broadcast messages
- [ ] Appointment reminders (24h before)
- [ ] Auto-follow-up after reading

---

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Meta WhatsApp API](https://developers.facebook.com/docs/whatsapp)
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)
- [OpenAI API](https://platform.openai.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [Stripe Payments](https://stripe.com/docs/payments)

---

## 📄 License

MIT License - Free to use and modify

---

## 🙏 Support

For issues or questions:
1. Check troubleshooting section
2. Review API documentation
3. Open GitHub issue
4. Contact: [your-email]

---

**Built with ❤️ for Samia Tarot**
*Empowering spiritual guidance through technology*

🔮✨🌙
