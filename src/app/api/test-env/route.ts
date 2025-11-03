/**
 * 🧪 Test Environment Variables
 * Debug endpoint to check which env vars are loaded
 */

import { NextResponse } from 'next/server'

export async function GET() {
  const envCheck = {
    META_WHATSAPP_VERIFY_TOKEN: process.env.META_WHATSAPP_VERIFY_TOKEN ? '✅ Set' : '❌ Missing',
    META_WHATSAPP_TOKEN: process.env.META_WHATSAPP_TOKEN ? '✅ Set' : '❌ Missing',
    META_WHATSAPP_PHONE_ID: process.env.META_WHATSAPP_PHONE_ID ? '✅ Set' : '❌ Missing',
    META_APP_SECRET: process.env.META_APP_SECRET ? '✅ Set' : '❌ Missing',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing',
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
    DATABASE_URL: process.env.DATABASE_URL ? '✅ Set' : '❌ Missing',
    WHATSAPP_PROVIDER: process.env.WHATSAPP_PROVIDER || 'Not set',

    // Show actual verify token value (for debugging)
    VERIFY_TOKEN_VALUE: process.env.META_WHATSAPP_VERIFY_TOKEN || 'undefined',
  }

  return NextResponse.json(envCheck)
}
