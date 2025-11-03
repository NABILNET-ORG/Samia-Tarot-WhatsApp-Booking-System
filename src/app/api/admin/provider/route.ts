/**
 * 🔄 Provider Switching API
 * Switch between Meta and Twilio WhatsApp providers
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { resetWhatsAppProvider } from '@/lib/whatsapp/factory'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider } = body

    // Validate provider
    if (provider !== 'meta' && provider !== 'twilio') {
      return NextResponse.json(
        { error: 'Invalid provider. Must be "meta" or "twilio"' },
        { status: 400 }
      )
    }

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

    console.log(`✅ WhatsApp provider switched to: ${provider}`)

    return NextResponse.json({
      success: true,
      provider,
      message: `Switched to ${provider}`,
    })
  } catch (error: any) {
    console.error('Provider switch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
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
}
