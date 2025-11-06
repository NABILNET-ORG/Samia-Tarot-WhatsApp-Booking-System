/**
 * 🔮 COMPLETE WhatsApp Webhook Handler
 * Full workflow with Supabase, AI, and all integrations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getWhatsAppProvider } from '@/lib/whatsapp/factory'
import { WorkflowEngine } from '@/lib/workflow/workflow-engine'
import { supabaseHelpers } from '@/lib/supabase/client'

/**
 * GET - Webhook verification (Meta)
 * Always verify Meta webhooks regardless of current provider setting
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Meta webhook verification
  const verifyToken = process.env.META_WHATSAPP_VERIFY_TOKEN

  if (mode === 'subscribe' && token === verifyToken && challenge) {
    console.log('✅ Meta webhook verified successfully')
    return new NextResponse(challenge, { status: 200 })
  }

  console.log('❌ Webhook verification failed:', { mode, tokenMatch: token === verifyToken, hasChallenge: !!challenge })
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

/**
 * POST - Handle incoming WhatsApp messages
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const provider = getWhatsAppProvider()

    console.log(`📱 Webhook received from ${provider.getName()}`)

    // Log webhook
    await supabaseHelpers.logWebhook({
      provider: provider.getName(),
      event_type: 'incoming_message',
      payload: body,
      processed: false,
    })

    // Parse message
    const incomingMessage = provider.parseIncomingMessage(body)

    if (!incomingMessage) {
      // Not a text message - could be status update, read receipt, delivery report, etc.
      console.log('⏭️  Non-message webhook (status update, read receipt, etc.) - skipping')
      return NextResponse.json({ received: true, skipped: true }, { status: 200 })
    }

    const { from, body: messageBody } = incomingMessage

    // Validate message has actual content
    if (!messageBody || messageBody.trim().length === 0) {
      console.log('⏭️  Empty message body - skipping')
      return NextResponse.json({ received: true, skipped: true }, { status: 200 })
    }

    // CRITICAL: Prevent infinite loop by ignoring messages FROM our own number
    const ourNumbers = [
      process.env.TWILIO_WHATSAPP_NUMBER,
      process.env.META_WHATSAPP_NUMBER,
      '+15556320392', // Fallback
    ].filter(Boolean)

    if (ourNumbers.some(num => from.includes(num!.replace(/\D/g, '')))) {
      console.log('⏭️  Message from our own number - ignoring to prevent loop')
      return NextResponse.json({ received: true, skipped: true }, { status: 200 })
    }

    console.log(`💬 Message from ${from}: "${messageBody}"`)

    // Find which business this message belongs to
    const { findBusinessByPhone, findBusinessByPhoneId } = await import('@/lib/business/lookup')

    let businessId: string | null = null

    // For Meta webhooks, extract phone_number_id for accurate routing
    if (provider.getName() === 'meta') {
      try {
        const phoneNumberId = body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id
        if (phoneNumberId) {
          console.log(`📱 Meta phone number ID: ${phoneNumberId}`)
          businessId = await findBusinessByPhoneId(phoneNumberId)
        }
      } catch (error) {
        console.warn('⚠️  Could not extract Meta phone number ID, falling back to phone lookup')
      }
    }

    // Fallback: lookup by customer phone number (Twilio or Meta without phone ID)
    if (!businessId) {
      businessId = await findBusinessByPhone(from)
    }

    if (!businessId) {
      console.error('❌ No business found for phone:', from)
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    console.log(`✅ Routing message to business ID: ${businessId}`)

    // Process message with AI engine (multi-tenant)
    const processResponse = await fetch(`${request.nextUrl.origin}/api/webhook/process-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: businessId,
        phone: from,
        message: messageBody,
        media_url: incomingMessage.mediaUrl,
        media_type: incomingMessage.mediaUrl ? 'image' : 'text',
      }),
    })

    if (!processResponse.ok) {
      throw new Error('Message processing failed')
    }

    // Mark webhook as processed
    const processingTime = Date.now() - startTime
    await supabaseHelpers.logWebhook({
      provider: provider.getName(),
      event_type: 'processed',
      payload: { success: true, from },
      processed: true,
      processing_time_ms: processingTime,
    })

    console.log(`✅ Message processed in ${processingTime}ms`)

    return NextResponse.json({
      success: true,
      processing_time_ms: processingTime,
    })
  } catch (error: any) {
    console.error('❌ Webhook error:', error)

    // Log error
    await supabaseHelpers.logWebhook({
      provider: getWhatsAppProvider().getName(),
      event_type: 'error',
      payload: { error: error.message },
      processed: false,
      error: error.stack,
      processing_time_ms: Date.now() - startTime,
    })

    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
