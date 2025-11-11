/**
 * 🔄 Provider Switching API
 * Switch between Meta and Twilio WhatsApp providers
 * Requires authentication - admin/owner roles only
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { resetWhatsAppProvider } from '@/lib/whatsapp/factory'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { AdminProviderSchema } from '@/lib/validation/schemas'

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
      const validationResult = AdminProviderSchema.safeParse(body)

      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationResult.error.issues },
          { status: 400 }
        )
      }

      const validatedData = validationResult.data
      const { provider } = validatedData

      // Update in database
      const { error } = await supabaseAdmin
        .from('system_settings')
        .update({ setting_value: provider })
        .eq('setting_key', 'whatsapp_provider')

      if (error) {
        throw new Error(`Database update failed: ${error.message}`)
      }

      // Reset provider instance to pick up new setting
      resetWhatsAppProvider()

      console.log(`✅ WhatsApp provider switched to: ${provider} by ${context.employee.email}`)

      return NextResponse.json({
        success: true,
        provider,
        message: `Switched to ${provider}`,
      })
    } catch (error: any) {
      console.error('Provider switch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}

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

      // Get current provider from database
      const { data, error } = await supabaseAdmin
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'whatsapp_provider')
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return NextResponse.json({
        provider: data?.setting_value || 'meta',
      })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  })
}
