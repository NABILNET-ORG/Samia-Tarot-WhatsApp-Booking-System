/**
 * 🧪 Test Environment Variables
 * Debug endpoint to check which env vars are loaded
 * DEVELOPMENT ONLY - Disabled in production for security
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'

export async function GET(request: NextRequest) {
  // Disable in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 404 }
    )
  }

  return requireBusinessContext(request, async (context) => {
    // Check if user has admin/owner role
    const allowedRoles = ['admin', 'owner']
    if (!allowedRoles.includes(context.employee.role_name.toLowerCase())) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Admin or Owner role required' },
        { status: 403 }
      )
    }

    const envCheck = {
      META_WHATSAPP_VERIFY_TOKEN: process.env.META_WHATSAPP_VERIFY_TOKEN ? '✅ Set' : '❌ Missing',
      META_WHATSAPP_TOKEN: process.env.META_WHATSAPP_TOKEN ? '✅ Set' : '❌ Missing',
      META_WHATSAPP_PHONE_ID: process.env.META_WHATSAPP_PHONE_ID ? '✅ Set' : '❌ Missing',
      META_APP_SECRET: process.env.META_APP_SECRET ? '✅ Set' : '❌ Missing',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing',
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
      DATABASE_URL: process.env.DATABASE_URL ? '✅ Set' : '❌ Missing',
      WHATSAPP_PROVIDER: process.env.WHATSAPP_PROVIDER || 'Not set',
      NODE_ENV: process.env.NODE_ENV,

      // Show actual verify token value (for debugging - dev only)
      VERIFY_TOKEN_VALUE: process.env.META_WHATSAPP_VERIFY_TOKEN || 'undefined',
    }

    return NextResponse.json(envCheck)
  })
}
