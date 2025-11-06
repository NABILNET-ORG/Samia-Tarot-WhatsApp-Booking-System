/**
 * 🔐 Business Secrets Management API
 * Admin-only endpoint for managing encrypted credentials
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requirePermission } from '@/lib/multi-tenant/middleware'
import { encrypt, decrypt } from '@/lib/security/encryption'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/businesses/[id]/secrets
 * Get decrypted secrets (Admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requirePermission(request, 'settings', 'read', async (context) => {
    // Only Admin and Owner roles can view secrets
    const isAdmin = context.employee.role.name === 'Admin' || context.employee.role.name === 'Owner'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Decrypt secrets before sending to frontend
    const secrets = {
      // OpenAI
      openai_api_key: business.openai_api_key_encrypted ? decrypt(business.openai_api_key_encrypted) : '',

      // Meta WhatsApp
      meta_phone_id: business.meta_phone_id || '',
      meta_access_token: business.meta_access_token_encrypted ? decrypt(business.meta_access_token_encrypted) : '',
      meta_app_secret: business.meta_app_secret_encrypted ? decrypt(business.meta_app_secret_encrypted) : '',
      meta_verify_token: business.meta_verify_token_encrypted ? decrypt(business.meta_verify_token_encrypted) : '',

      // Twilio
      twilio_account_sid: business.twilio_account_sid_encrypted ? decrypt(business.twilio_account_sid_encrypted) : '',
      twilio_auth_token: business.twilio_auth_token_encrypted ? decrypt(business.twilio_auth_token_encrypted) : '',
      twilio_whatsapp_number: business.twilio_whatsapp_number || '',

      // Stripe
      stripe_secret_key: business.stripe_secret_key_encrypted ? decrypt(business.stripe_secret_key_encrypted) : '',
      stripe_publishable_key: business.stripe_publishable_key || '',
      stripe_webhook_secret: business.stripe_webhook_secret_encrypted ? decrypt(business.stripe_webhook_secret_encrypted) : '',

      // Google
      google_client_id: business.google_client_id_encrypted ? decrypt(business.google_client_id_encrypted) : '',
      google_client_secret: business.google_client_secret_encrypted ? decrypt(business.google_client_secret_encrypted) : '',
      google_refresh_token: business.google_refresh_token_encrypted ? decrypt(business.google_refresh_token_encrypted) : '',
      google_calendar_id: business.google_calendar_id || '',
    }

    return NextResponse.json({ secrets })
  })
}

/**
 * PATCH /api/businesses/[id]/secrets
 * Update and encrypt secrets (Admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requirePermission(request, 'settings', 'write', async (context) => {
    // Only Admin and Owner roles can update secrets
    const isAdmin = context.employee.role.name === 'Admin' || context.employee.role.name === 'Owner'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await request.json()

    // Encrypt all secrets before storing
    const updates: any = {}

    // OpenAI
    if (body.openai_api_key) updates.openai_api_key_encrypted = encrypt(body.openai_api_key)

    // Meta WhatsApp
    if (body.meta_phone_id) updates.meta_phone_id = body.meta_phone_id
    if (body.meta_access_token) updates.meta_access_token_encrypted = encrypt(body.meta_access_token)
    if (body.meta_app_secret) updates.meta_app_secret_encrypted = encrypt(body.meta_app_secret)
    if (body.meta_verify_token) updates.meta_verify_token_encrypted = encrypt(body.meta_verify_token)

    // Also update whatsapp_phone_number_id for webhook routing
    if (body.meta_phone_id) updates.whatsapp_phone_number_id = body.meta_phone_id

    // Twilio
    if (body.twilio_account_sid) updates.twilio_account_sid_encrypted = encrypt(body.twilio_account_sid)
    if (body.twilio_auth_token) updates.twilio_auth_token_encrypted = encrypt(body.twilio_auth_token)
    if (body.twilio_whatsapp_number) updates.twilio_whatsapp_number = body.twilio_whatsapp_number

    // Stripe
    if (body.stripe_secret_key) updates.stripe_secret_key_encrypted = encrypt(body.stripe_secret_key)
    if (body.stripe_publishable_key) updates.stripe_publishable_key = body.stripe_publishable_key
    if (body.stripe_webhook_secret) updates.stripe_webhook_secret_encrypted = encrypt(body.stripe_webhook_secret)

    // Google
    if (body.google_client_id) updates.google_client_id_encrypted = encrypt(body.google_client_id)
    if (body.google_client_secret) updates.google_client_secret_encrypted = encrypt(body.google_client_secret)
    if (body.google_refresh_token) updates.google_refresh_token_encrypted = encrypt(body.google_refresh_token)
    if (body.google_calendar_id) updates.google_calendar_id = body.google_calendar_id

    // Update database
    const { error } = await supabaseAdmin
      .from('businesses')
      .update(updates)
      .eq('id', params.id)

    if (error) {
      console.error('Failed to update secrets:', error)
      return NextResponse.json({ error: 'Failed to save secrets' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Secrets saved successfully', updated: Object.keys(updates).length })
  })
}
