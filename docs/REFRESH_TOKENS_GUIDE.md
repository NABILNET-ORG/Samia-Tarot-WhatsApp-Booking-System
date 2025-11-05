# 🔄 Token Refresh Guide

## Your Tokens Are Expired - Here's How to Get New Ones

---

## 1️⃣ META WHATSAPP TOKEN (Expired)

### **Issue:**
Meta WhatsApp access tokens expire after 60-90 days. You need a **permanent token** or refresh mechanism.

### **Solution A: Get Permanent Token (Recommended)**

**Steps:**
1. Go to [Meta Business Suite](https://business.facebook.com/)
2. Settings → Business Settings → Users → System Users
3. Create System User (or select existing)
4. Assign assets: Your WhatsApp Business Account
5. Generate token:
   - Permissions needed: `whatsapp_business_messaging`, `whatsapp_business_management`
   - Token Type: **Permanent** (never expires)
6. Copy the new token

**Add to Vercel:**
```
META_WHATSAPP_TOKEN = EAAxxxx... (new permanent token)
```

**Or update in database:**
```sql
UPDATE businesses
SET meta_access_token_encrypted = encrypt_api_key('EAAxxxx...', business_id)
WHERE id = 'your-business-id';
```

### **Solution B: Use Graph API Explorer (Temporary)**

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app
3. Get User Access Token
4. Request permissions: `whatsapp_business_messaging`
5. Generate Access Token
6. **Warning:** Expires in 60 days - use Solution A for production

---

## 2️⃣ GOOGLE REFRESH TOKEN (Expired)

### **Issue:**
Google refresh tokens can expire if not used for 6 months, or if user changes password.

### **Solution: Generate New Refresh Token**

**Steps:**

1. **Enable Google Calendar API:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project (or create new)
   - Enable: Google Calendar API
   - Enable: Google Contacts API (if using contacts)

2. **Create OAuth 2.0 Credentials:**
   - APIs & Services → Credentials
   - Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
   - Save Client ID and Client Secret

3. **Get Refresh Token:**

Use this Node.js script (save as `scripts/get_google_refresh_token.js`):

```javascript
const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = 'your-client-id';
const CLIENT_SECRET = 'your-client-secret';
const REDIRECT_URI = 'http://localhost:3000/api/auth/google/callback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/contacts',
];

// Step 1: Get authorization URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent', // Force to get refresh token
});

console.log('Visit this URL to authorize:');
console.log(authUrl);
console.log('\\n');

// Step 2: Exchange code for tokens
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the authorization code: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\\n✅ Tokens received!');
    console.log('\\nAdd these to your .env:');
    console.log(`GOOGLE_CLIENT_ID="${CLIENT_ID}"`);
    console.log(`GOOGLE_CLIENT_SECRET="${CLIENT_SECRET}"`);
    console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`);
    console.log(`GOOGLE_CALENDAR_ID="your-email@gmail.com"`);
  } catch (error) {
    console.error('Error getting tokens:', error);
  }
  rl.close();
});
```

**Run it:**
```bash
node scripts/get_google_refresh_token.js
```

4. **Follow the prompts:**
   - Visit the authorization URL
   - Sign in with Google account
   - Grant permissions
   - Copy the authorization code from URL
   - Paste into terminal
   - Get your new refresh token

5. **Update .env and Vercel:**
```
GOOGLE_REFRESH_TOKEN=1//04xxx... (new refresh token)
```

---

## 3️⃣ UPDATE TOKENS IN PLATFORM

### **Option A: Via Environment Variables (For Samia Tarot default)**

**Local (.env):**
```bash
META_WHATSAPP_TOKEN="EAAxxxx..." (new permanent token)
GOOGLE_REFRESH_TOKEN="1//04xxx..." (new refresh token)
```

**Vercel Dashboard:**
1. Go to: https://vercel.com/nabils-projects-447e19b8/samia-tarot-app/settings/environment-variables
2. Find existing variables
3. Click Edit → Update value
4. Redeploy

### **Option B: Via Database (Per Business)**

**For specific businesses:**
```sql
-- Update Meta token (encrypted)
UPDATE businesses
SET meta_access_token_encrypted = [use encryption function]
WHERE id = 'business-id';

-- Update Google token (encrypted)
UPDATE businesses
SET google_refresh_token_encrypted = [use encryption function]
WHERE id = 'business-id';
```

**Or use the settings UI:**
1. Login to /dashboard
2. Go to /dashboard/settings
3. Update WhatsApp token
4. Update Google token
5. Save

---

## 4️⃣ VERIFICATION

### **Test Meta WhatsApp:**
```bash
# Send test message
POST /api/messages
{
  "conversation_id": "xxx",
  "content": "Test message",
  "message_type": "text"
}

# Check if customer receives it
```

### **Test Google Calendar:**
```bash
# Try to create calendar event
# Should work with new refresh token
```

---

## 🔐 **IMPORTANT: Token Security**

### **Never Commit Tokens to Git:**
- ✅ `.env` is in `.gitignore`
- ✅ Tokens are encrypted in database
- ✅ Only decrypt when needed

### **Rotate Regularly:**
- Meta: Get permanent token (never expires)
- Google: Refresh tokens last indefinitely if used regularly
- Stripe: Rotate annually
- OpenAI: Rotate quarterly

### **Monitor Expiration:**
Add to your platform (future feature):
- Check token expiry dates
- Alert before expiration
- Auto-refresh where possible

---

## 🚨 **Quick Fix for NOW:**

**1. Get new Meta token:** (5 minutes)
- Use System User method above
- Get permanent token
- Update in Vercel env vars

**2. Get new Google token:** (10 minutes)
- Run the script above
- Follow OAuth flow
- Update in Vercel env vars

**3. Redeploy:**
```bash
vercel --prod
```

**4. Test:**
- Send WhatsApp message from dashboard
- Check if customer receives
- Try voice transcription (if using Google Speech)

---

## 📞 **Need Help?**

**Meta WhatsApp Token Issues:**
- Check: [Meta Business Help Center](https://business.facebook.com/business/help)
- Verify: Your app is approved for WhatsApp Business API
- Ensure: Business verification is complete

**Google Token Issues:**
- Check: OAuth consent screen is configured
- Verify: APIs are enabled in Cloud Console
- Ensure: Scopes are correct

---

**After updating tokens, your platform will be fully operational!** ✅

**Token Usage: 330.6K/1000K (33.1%), 669.4K remaining**
