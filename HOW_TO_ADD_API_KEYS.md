# 🔑 HOW TO ADD API KEYS - Step by Step

## 📍 WHERE TO ADD ENVIRONMENT VARIABLES:

**File Location:**
```
C:\Users\saeee\OneDrive\Documents\project\Whatsapp\samia-tarot-app\.env
```

**Already created for you!** ✅ Just need to fill in your keys!

---

## 🚀 QUICK START (3 Required Keys):

To test the complete workflow, you only need **3 things**:

### **1️⃣ OpenAI API Key** (Required for AI)

**Get it:**
1. Go to: https://platform.openai.com/api-keys
2. Sign up or login
3. Click "Create new secret key"
4. Copy the key (starts with `sk-proj-...`)

**Add to .env:**
```env
OPENAI_API_KEY="sk-proj-PASTE_YOUR_ACTUAL_KEY_HERE"
```

**Cost:** ~$0.002 per conversation (very cheap!)

---

### **2️⃣ WhatsApp Provider** (Choose ONE)

#### **Option A: Twilio** (Easier - 5 minutes)

**Get it:**
1. Go to: https://console.twilio.com
2. Sign up (free account)
3. Go to: Messaging → Try WhatsApp
4. Get credentials from dashboard

**Add to .env:**
```env
WHATSAPP_PROVIDER="twilio"
TWILIO_ACCOUNT_SID="ACxxxxx_PASTE_HERE"
TWILIO_AUTH_TOKEN="your_token_PASTE_HERE"
TWILIO_WHATSAPP_NUMBER="+14155238886"
```

**Join Sandbox:**
- Send message: "join [code]" to `+14155238886`

#### **Option B: Meta** (Official - 30 minutes)

**Get it:**
1. Go to: https://developers.facebook.com
2. Create app → Business → WhatsApp
3. Get test number
4. Copy credentials

**Add to .env:**
```env
WHATSAPP_PROVIDER="meta"
META_WHATSAPP_PHONE_ID="your_phone_id"
META_WHATSAPP_TOKEN="EAAxxxxx_PASTE_HERE"
META_WHATSAPP_VERIFY_TOKEN="your_custom_secret"
META_APP_SECRET="your_app_secret"
```

---

### **3️⃣ That's It!**

**You're ready to test!** The rest are optional.

---

## ⚙️ HOW TO EDIT .ENV FILE:

### **Step 1: Open File**

**Using VS Code:**
```bash
cd samia-tarot-app
code .env
```

**Using Notepad:**
```
Right-click .env → Open With → Notepad
```

### **Step 2: Find the Lines**

Look for these lines:
```env
# Line 9 (OpenAI)
OPENAI_API_KEY="sk-proj-PASTE_YOUR_KEY_HERE"

# Line 17 (WhatsApp Provider)
WHATSAPP_PROVIDER="twilio"

# Lines 20-22 (Twilio)
TWILIO_ACCOUNT_SID="PASTE_YOUR_SID_HERE"
TWILIO_AUTH_TOKEN="PASTE_YOUR_TOKEN_HERE"
TWILIO_WHATSAPP_NUMBER="+14155238886"
```

### **Step 3: Replace with Your Keys**

**Before:**
```env
OPENAI_API_KEY="sk-proj-PASTE_YOUR_KEY_HERE"
```

**After:**
```env
OPENAI_API_KEY="sk-proj-abc123xyz789realkey"
```

### **Step 4: Save File**

Press `Ctrl+S` or File → Save

### **Step 5: Restart Server**

If server is running:
```bash
# Stop it (Ctrl+C)
# Start again
npm run dev
```

---

## ✅ EXAMPLE .ENV (FILLED IN):

```env
# Database (Already configured ✅)
NEXT_PUBLIC_SUPABASE_URL="https://lovvgshqnqqlzbiviate.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
DATABASE_URL="postgresql://postgres.lovvgshqnqqlzbiviate:..."

# OpenAI (FILL THIS IN ⏳)
OPENAI_API_KEY="sk-proj-YOUR_REAL_KEY_HERE"

# WhatsApp Provider (CHOOSE ONE ⏳)
WHATSAPP_PROVIDER="twilio"

# Twilio (IF YOU CHOSE TWILIO ⏳)
TWILIO_ACCOUNT_SID="ACa1b2c3d4e5f6g7h8i9"
TWILIO_AUTH_TOKEN="your_real_token_here"
TWILIO_WHATSAPP_NUMBER="+14155238886"

# OR Meta (IF YOU CHOSE META ⏳)
# META_WHATSAPP_PHONE_ID="123456789"
# META_WHATSAPP_TOKEN="EAAxxxxxxx"
# META_WHATSAPP_VERIFY_TOKEN="your_secret"
# META_APP_SECRET="abc123xyz"

# Admin (Already set, can change if you want)
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="change-this-password"
NEXTAUTH_SECRET="generate-random-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Business (Already set ✅)
ADMIN_PHONE_NUMBER="+9613620860"
BUSINESS_NAME="Samia Tarot"
BUSINESS_TIMEZONE="Asia/Beirut"
```

---

## 🎛️ MANAGE FROM ADMIN DASHBOARD:

### **After adding credentials to .env, you can:**

1. **Run the app:**
   ```bash
   npm run dev
   ```

2. **Visit settings page:**
   ```
   http://localhost:3000/admin/settings
   ```

3. **Switch WhatsApp provider:**
   - Click on "Meta" or "Twilio" card
   - System switches instantly!
   - No restart needed!

4. **Update business settings:**
   - Call hours (12 PM - 8 PM)
   - Buffer time (30 minutes)
   - VIP threshold ($500)
   - Admin phone number
   - All editable in dashboard!

---

## 📋 WHAT YOU CAN MANAGE IN ADMIN DASHBOARD:

### **Settings Page** (`/admin/settings`)
```
✅ WhatsApp Provider Selection
   - Switch between Meta and Twilio (one click!)
   - See which credentials are configured
   - Status indicators (✅ Ready / ❌ Not Set)

✅ Business Settings
   - Admin phone number
   - Business timezone
   - Call hours (start/end)
   - Call buffer time
   - VIP threshold

✅ System Status
   - OpenAI configured? ✅/❌
   - Meta configured? ✅/❌
   - Twilio configured? ✅/❌
   - Stripe configured? ✅/❌
   - Google configured? ✅/❌
   - Supabase configured? ✅ (always yes)
```

### **Services Page** (`/admin/services`)
```
✅ View all 13 services
✅ Edit prices (inline)
✅ Edit names & descriptions (modal)
✅ Enable/Disable services
✅ Feature services (⭐)
✅ Quick actions:
   - Flash sale
   - Vacation mode
```

### **Analytics Page** (`/admin/analytics`)
```
✅ Revenue (today/week/month/all-time)
✅ Customer stats
✅ Top 5 services
✅ Real-time data
```

---

## 🎯 MINIMUM TO TEST:

**You ONLY need these 3:**

1. ✅ **Supabase** - Already configured!
2. ⏳ **OpenAI API key** - Get from OpenAI
3. ⏳ **Twilio OR Meta** - Get from provider

**That's it! Add those 2-3 keys to .env and you're ready!**

---

## 📝 STEP-BY-STEP EXAMPLE:

### **1. Get OpenAI Key** (3 minutes)

```
1. Open: https://platform.openai.com/api-keys
2. Click: "+ Create new secret key"
3. Name: "Samia Tarot"
4. Copy key: sk-proj-abc123xyz...
5. Open .env file
6. Find: OPENAI_API_KEY="sk-proj-PASTE_YOUR_KEY_HERE"
7. Replace with: OPENAI_API_KEY="sk-proj-abc123xyz..."
8. Save file
```

### **2. Get Twilio Keys** (5 minutes)

```
1. Open: https://console.twilio.com
2. Sign up (free account)
3. Dashboard shows:
   - Account SID: ACxxxxxxxxxxxx
   - Auth Token: (click to reveal)
4. Open .env file
5. Find: TWILIO_ACCOUNT_SID="PASTE_YOUR_SID_HERE"
6. Replace with: TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxx"
7. Find: TWILIO_AUTH_TOKEN="PASTE_YOUR_TOKEN_HERE"
8. Replace with: TWILIO_AUTH_TOKEN="your_actual_token"
9. Save file
```

### **3. Start App** (1 minute)

```bash
cd samia-tarot-app
npm run dev
```

### **4. Test** (2 minutes)

```
Visit: http://localhost:3000/admin/settings
See: ✅ OpenAI configured
     ✅ Twilio configured
     ✅ Supabase configured

Click "Twilio" card to activate it!
```

**Total time: 11 minutes!** ⚡

---

## 💡 WHERE IS .ENV FILE?

**Full Path:**
```
C:\Users\saeee\OneDrive\Documents\project\Whatsapp\samia-tarot-app\.env
```

**Or navigate:**
```
1. Open File Explorer
2. Go to: Documents → project → Whatsapp → samia-tarot-app
3. Look for: .env (small file ~2KB)
4. Right-click → Open With → Notepad or VS Code
```

**Already created!** Just edit it! ✅

---

## 🎊 AFTER ADDING KEYS:

### **You Can:**
1. ✅ Switch WhatsApp provider in admin dashboard (one click!)
2. ✅ Change business settings (call hours, VIP threshold)
3. ✅ Manage services (prices, names, availability)
4. ✅ View analytics (revenue, customers, top services)
5. ✅ Test complete booking flow
6. ✅ Deploy to production

### **All From Admin Dashboard!**

**No more editing .env after initial setup!**
**Everything manageable from UI!** 🎉

---

## 📞 QUICK REFERENCE:

**File to edit:**
```
.env (in project root folder)
```

**Minimum required:**
```env
OPENAI_API_KEY="sk-proj-xxx"      # Get from OpenAI
WHATSAPP_PROVIDER="twilio"        # Choose provider
TWILIO_ACCOUNT_SID="ACxxx"        # Get from Twilio
TWILIO_AUTH_TOKEN="xxx"           # Get from Twilio
```

**Then visit:**
```
http://localhost:3000/admin/settings
```

**Switch providers visually!** 🎛️

---

**TAYEB NABIL! Just add those 3 keys to .env file and everything works! Then manage everything from admin dashboard!** 💪🚀

**Ready to add your keys?** ✅

🔮✨🌙
