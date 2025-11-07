/**
 * ⚙️ Admin Settings API
 * Manage all system settings including WhatsApp provider
 * Requires authentication - admin/owner roles only
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { resetWhatsAppProvider } from '@/lib/whatsapp/factory'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'

/**
 * GET - Get all settings
 */
export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      // Check if user has admin/owner role
      const allowedRoles = ['admin', 'owner']
      if (!allowedRoles.includes(context.employee.role_name.toLowerCase())) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Admin or Owner role required' },
          { status: 403 }
        )
      }

      // Get from database
      const { data: settings, error } = await supabaseAdmin
        .from('system_settings')
        .select('*')
        .order('setting_key')

      if (error) {
        throw new Error(error.message)
      }

      // Convert to key-value object
      const settingsObj: any = {}
      settings?.forEach((setting: any) => {
        settingsObj[setting.setting_key] = {
          value: setting.setting_value,
          type: setting.setting_type,
          description: setting.description,
        }
      })

      // Add current environment status
      const envStatus = {
        openai_configured: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-proj-PASTE_YOUR_KEY_HERE',
        meta_configured: !!(
          process.env.META_WHATSAPP_PHONE_ID &&
          process.env.META_WHATSAPP_TOKEN &&
          process.env.META_WHATSAPP_PHONE_ID !== 'your-phone-number-id'
        ),
        twilio_configured: !!(
          process.env.TWILIO_ACCOUNT_SID &&
          process.env.TWILIO_AUTH_TOKEN &&
          process.env.TWILIO_ACCOUNT_SID !== 'PASTE_YOUR_SID_HERE'
        ),
        stripe_configured: !!(
          process.env.STRIPE_SECRET_KEY &&
          process.env.STRIPE_SECRET_KEY !== 'sk_test_your_key_here'
        ),
        google_configured: !!(
          process.env.GOOGLE_CLIENT_ID &&
          process.env.GOOGLE_CLIENT_ID !== 'your-client-id.apps.googleusercontent.com'
        ),
      }

      return NextResponse.json({
        settings: settingsObj,
        env_status: envStatus,
      })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}

/**
 * POST - Update setting
 */
export async function POST(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      // Check if user has admin/owner role
      const allowedRoles = ['admin', 'owner']
      if (!allowedRoles.includes(context.employee.role_name.toLowerCase())) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Admin or Owner role required' },
          { status: 403 }
        )
      }

      const body = await request.json()
      const { key, value } = body

      // Special handling for WhatsApp provider
      if (key === 'whatsapp_provider') {
        // Validate provider
        if (value !== 'meta' && value !== 'twilio') {
          throw new Error('Invalid provider. Must be "meta" or "twilio"')
        }

        // Check if credentials exist
        if (value === 'meta') {
          if (!process.env.META_WHATSAPP_TOKEN) {
            throw new Error('Meta credentials not configured in .env file')
          }
        } else if (value === 'twilio') {
          if (!process.env.TWILIO_ACCOUNT_SID) {
            throw new Error('Twilio credentials not configured in .env file')
          }
        }

        // Reset provider instance to pick up new setting
        resetWhatsAppProvider()
      }

      // Update in database
      const { error } = await supabaseAdmin
        .from('system_settings')
        .update({ setting_value: value })
        .eq('setting_key', key)

      if (error) {
        throw new Error(error.message)
      }

      // Also update environment variable (runtime)
      // Note: This won't persist across restarts
      // For permanent change, user must update .env file
      process.env[key.toUpperCase()] = value

      console.log(`✅ Setting ${key} updated by ${context.employee.email}`)

      return NextResponse.json({
        success: true,
        message: `Setting ${key} updated to ${value}`,
      })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}

/**
 * PUT - Bulk update settings
 */
export async function PUT(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      // Check if user has admin/owner role
      const allowedRoles = ['admin', 'owner']
      if (!allowedRoles.includes(context.employee.role_name.toLowerCase())) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Admin or Owner role required' },
          { status: 403 }
        )
      }

      const body = await request.json()
      const { settings } = body

      for (const [key, value] of Object.entries(settings)) {
        await supabaseAdmin
          .from('system_settings')
          .update({ setting_value: value as string })
          .eq('setting_key', key)
      }

      console.log(`✅ Bulk settings updated by ${context.employee.email}`)

      return NextResponse.json({ success: true })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}
