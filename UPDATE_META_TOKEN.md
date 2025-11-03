# 🔄 UPDATE META WHATSAPP TOKEN

## 🎯 NEW META TOKEN:

```
EAAKAZA7XAZCfYBPwvTZCSDZC1jDSxM2qxv1yjQlTwBlkJikVSRqZAZCNiZCQvjrCaCt8JgYnCL9Bv4ZClyZCjANU2QAgDEfyAieaWhh9oLKKAgDtygc2mo8oqbWw5nT1PE4ej82RMCwScZBpY9Yr3w1ojwWZAfNROmvRsgNamKCPwDK8KLbSNiz9ENW5coMIUeaKwPMb6hBeQCMrNBhY9zl7ZCG6FZA2AHqFv8KPAhXhS6pKGcBV0f75MvPmpMjZC8ZA1WKTVcCCB28Ow6InZAqbN3JdZAkG8NmYSTYXmOdBKlAZDZD
```

---

## ⚡ QUICK UPDATE (2 STEPS):

### **STEP 1: Update in Vercel Dashboard**

```
1. Go to: https://vercel.com/nabils-projects-447e19b8/samia-tarot-app/settings/environment-variables

2. Find: META_WHATSAPP_TOKEN

3. Click "..." → Edit

4. Replace with new token:
   EAAKAZA7XAZCfYBPwvTZCSDZC1jDSxM2qxv1yjQlTwBlkJikVSRqZAZCNiZCQvjrCaCt8JgYnCL9Bv4ZClyZCjANU2QAgDEfyAieaWhh9oLKKAgDtygc2mo8oqbWw5nT1PE4ej82RMCwScZBpY9Yr3w1ojwWZAfNROmvRsgNamKCPwDK8KLbSNiz9ENW5coMIUeaKwPMb6hBeQCMrNBhY9zl7ZCG6FZA2AHqFv8KPAhXhS6pKGcBV0f75MvPmpMjZC8ZA1WKTVcCCB28Ow6InZAqbN3JdZAkG8NmYSTYXmOdBKlAZDZD

5. Save
```

### **STEP 2: Redeploy**

```
Deployments → Latest → "..." → Redeploy
```

**Wait 2 minutes for redeployment.**

---

## 💡 WHY TOKEN DISCONNECTS:

**Temporary tokens expire!**

Meta gives 2 types of tokens:

### **1. Temporary Token** (what you have now)
- From "Getting Started" page
- Expires every 24 hours! ⏰
- Must be refreshed constantly
- **Not good for production!** ❌

### **2. Permanent Token** (what you need!)
- Never expires! ✅
- From System Users
- **Perfect for production!** ✅

---

## 🔑 GET PERMANENT TOKEN (5 MINUTES):

### **Step 1: Create System User**

```
1. Go to: Meta Business Suite
2. Business Settings → Users → System Users
3. Click: "Add"
4. Name: "Samia Tarot Bot"
5. Role: Admin
6. Create
```

### **Step 2: Assign App**

```
1. Click on "Samia Tarot Bot"
2. Assign Assets → Apps
3. Select your app: "Samia Tarot Booking"
4. Full Control
5. Save
```

### **Step 3: Generate Token**

```
1. Click: "Generate new token"
2. App: Samia Tarot Booking
3. Permissions:
   ☑ whatsapp_business_messaging
   ☑ whatsapp_business_management
4. Generate token
5. COPY IT IMMEDIATELY! (won't show again!)
```

**This token NEVER expires!** ✅

### **Step 4: Update Everywhere**

**In .env:**
```env
META_WHATSAPP_TOKEN="[new permanent token]"
```

**In Vercel:**
```
Update META_WHATSAPP_TOKEN with new token
Redeploy
```

---

## ⚡ FOR NOW (QUICK FIX):

**I'll update your .env with the new token:**

Your new token:
```
EAAKAZA7XAZCfYBPwvTZCSDZC1jDSxM2qxv1yjQlTwBlkJikVSRqZAZCNiZCQvjrCaCt8JgYnCL9Bv4ZClyZCjANU2QAgDEfyAieaWhh9oLKKAgDtygc2mo8oqbWw5nT1PE4ej82RMCwScZBpY9Yr3w1ojwWZAfNROmvRsgNamKCPwDK8KLbSNiz9ENW5coMIUeaKwPMb6hBeQCMrNBhY9zl7ZCG6FZA2AHqFv8KPAhXhS6pKGcBV0f75MvPmpMjZC8ZA1WKTVcCCB28Ow6InZAqbN3JdZAkG8NmYSTYXmOdBKlAZDZD
```

**But this will expire again in 24 hours!**

**Better:** Get permanent token following steps above! 🔑

---

## 🎊 SUMMARY:

**Current situation:**
- ✅ Webhook verified
- ✅ Environment variables set
- ⏳ Need to update META_WHATSAPP_TOKEN in Vercel
- ⏳ Need to subscribe to "messages" field
- ⏳ Better: Get permanent token (won't disconnect!)

**Quick fix (works for 24h):**
1. Update token in Vercel
2. Redeploy
3. Subscribe to "messages"
4. Test

**Permanent fix (works forever):**
1. Create System User
2. Generate permanent token
3. Update everywhere
4. Never expires! ✅

---

**NABIL! Update the token in Vercel, redeploy, subscribe to "messages", then test!** 🚀

**And get permanent token so it doesn't disconnect every 24 hours!** 💪

🔮✨🌙
