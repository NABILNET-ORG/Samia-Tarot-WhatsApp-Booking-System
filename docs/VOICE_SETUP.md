# 🎤 Voice Transcription Setup Guide

## Google Speech-to-Text Configuration

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Speech-to-Text API

### 2. Create Service Account

```bash
# In Google Cloud Console:
1. Go to IAM & Admin → Service Accounts
2. Create Service Account
3. Grant role: "Cloud Speech-to-Text User"
4. Create JSON key
5. Download the JSON file
```

### 3. Add Environment Variable

Add to `.env`:

```bash
# Google Speech-to-Text
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project",...}'
```

Or use the existing Google OAuth credentials if already configured.

### 4. Pricing

- **$0.006 per 15 seconds** of audio
- Example costs:
  - 30-second voice note = $0.012
  - 100 voice notes/day = $1.20/day = $36/month
  - 300 voice notes/day = $3.60/day = $108/month

### 5. Features

✅ **Automatic language detection** (English, Arabic)
✅ **Confidence scores** (0.0 - 1.0)
✅ **Real-time transcription**
✅ **Cost tracking** per message
✅ **Transcription caching** (stored in database)

### 6. Usage

Voice messages from WhatsApp are automatically:
1. Stored in Supabase Storage
2. Transcribed via Google Speech-to-Text
3. Displayed with audio player
4. Shown with transcription text

### 7. Testing

```typescript
// Manual transcription via API
POST /api/voice/transcribe
{
  "message_id": "uuid",
  "audio_url": "https://...",
  "language_code": "en-US" // or "ar-SA" for Arabic
}
```

### 8. Supported Audio Formats

- OGG Opus (WhatsApp default)
- MP3
- WAV
- FLAC

## Cost Optimization Tips

1. **Cache transcriptions** - Store in database (already implemented)
2. **Only transcribe when requested** - Optional button in UI
3. **Set duration limits** - Skip very short (<3s) or very long (>60s) messages
4. **Monitor usage** - Track costs in business dashboard
