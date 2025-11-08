/**
 * 🔐 Business Secrets Management API
 * Admin-only endpoint for managing encrypted credentials
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requirePermission } from '@/lib/multi-tenant/middleware'
import { encryptApiKey, decryptApiKey } from '@/lib/encryption/keys'
import { Pool } from 'pg'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Direct PostgreSQL connection to bypass PostgREST schema cache
const getDbPool = () => {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL not configured')
  }
  return new Pool({ connectionString, max: 1 })
}

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
    console.log('🔐 Secrets access attempt:', {
      employee: context.employee.email,
      role: context.employee.role_name,
      permissions: context.employee.permissions
    })

    const isAdmin = ['admin', 'owner'].includes(context.employee.role_name?.toLowerCase() || '') ||
                    context.employee.permissions?.settings?.write === true

    if (!isAdmin) {
      return NextResponse.json({
        error: 'Forbidden: Admin access required',
        your_role: context.employee.role_name,
        required_roles: ['Admin', 'Owner']
      }, { status: 403 })
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
    const businessId = params.id
    const secrets = {
      // OpenAI
      openai_api_key: business.openai_api_key_encrypted ? decryptApiKey(business.openai_api_key_encrypted, businessId) : '',

      // Meta WhatsApp
      meta_phone_id: business.meta_phone_id || '',
      meta_access_token: business.meta_access_token_encrypted ? decryptApiKey(business.meta_access_token_encrypted, businessId) : '',
      meta_app_secret: business.meta_app_secret_encrypted ? decryptApiKey(business.meta_app_secret_encrypted, businessId) : '',
      meta_verify_token: business.meta_verify_token_encrypted ? decryptApiKey(business.meta_verify_token_encrypted, businessId) : '',

      // Twilio
      twilio_account_sid: business.twilio_account_sid_encrypted ? decryptApiKey(business.twilio_account_sid_encrypted, businessId) : '',
      twilio_auth_token: business.twilio_auth_token_encrypted ? decryptApiKey(business.twilio_auth_token_encrypted, businessId) : '',
      twilio_whatsapp_number: business.twilio_whatsapp_number || '',

      // Stripe
      stripe_secret_key: business.stripe_secret_key_encrypted ? decryptApiKey(business.stripe_secret_key_encrypted, businessId) : '',
      stripe_publishable_key: business.stripe_publishable_key || '',
      stripe_webhook_secret: business.stripe_webhook_secret_encrypted ? decryptApiKey(business.stripe_webhook_secret_encrypted, businessId) : '',

      // Google
      google_client_id: business.google_client_id_encrypted ? decryptApiKey(business.google_client_id_encrypted, businessId) : '',
      google_client_secret: business.google_client_secret_encrypted ? decryptApiKey(business.google_client_secret_encrypted, businessId) : '',
      google_refresh_token: business.google_refresh_token_encrypted ? decryptApiKey(business.google_refresh_token_encrypted, businessId) : '',
      // Note: google_calendar_id is not a secret, available via general settings API
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
    console.log('🔐 Secrets update attempt:', {
      employee: context.employee.email,
      role: context.employee.role_name,
      permissions: context.employee.permissions
    })

    const isAdmin = ['admin', 'owner'].includes(context.employee.role_name?.toLowerCase() || '') ||
                    context.employee.permissions?.settings?.write === true

    if (!isAdmin) {
      return NextResponse.json({
        error: 'Forbidden: Admin access required',
        your_role: context.employee.role_name,
        required_roles: ['Admin', 'Owner']
      }, { status: 403 })
    }

    const body = await request.json()
    const businessId = params.id

    // Encrypt all secrets before storing
    const updates: any = {}

    try {
      // OpenAI
      if (body.openai_api_key) updates.openai_api_key_encrypted = encryptApiKey(body.openai_api_key, businessId)

      // Meta WhatsApp
      if (body.meta_phone_id) updates.meta_phone_id = body.meta_phone_id
      if (body.meta_access_token) updates.meta_access_token_encrypted = encryptApiKey(body.meta_access_token, businessId)
      if (body.meta_app_secret) updates.meta_app_secret_encrypted = encryptApiKey(body.meta_app_secret, businessId)
      if (body.meta_verify_token) updates.meta_verify_token_encrypted = encryptApiKey(body.meta_verify_token, businessId)

      // Also update whatsapp_phone_number_id for webhook routing
      if (body.meta_phone_id) updates.whatsapp_phone_number_id = body.meta_phone_id

      // Twilio
      if (body.twilio_account_sid) updates.twilio_account_sid_encrypted = encryptApiKey(body.twilio_account_sid, businessId)
      if (body.twilio_auth_token) updates.twilio_auth_token_encrypted = encryptApiKey(body.twilio_auth_token, businessId)
      if (body.twilio_whatsapp_number) updates.twilio_whatsapp_number = body.twilio_whatsapp_number

      // Stripe
      if (body.stripe_secret_key) updates.stripe_secret_key_encrypted = encryptApiKey(body.stripe_secret_key, businessId)
      if (body.stripe_publishable_key) updates.stripe_publishable_key = body.stripe_publishable_key
      if (body.stripe_webhook_secret) updates.stripe_webhook_secret_encrypted = encryptApiKey(body.stripe_webhook_secret, businessId)

      // Google
      if (body.google_client_id) updates.google_client_id_encrypted = encryptApiKey(body.google_client_id, businessId)
      if (body.google_client_secret) updates.google_client_secret_encrypted = encryptApiKey(body.google_client_secret, businessId)
      if (body.google_refresh_token) updates.google_refresh_token_encrypted = encryptApiKey(body.google_refresh_token, businessId)
      // Note: google_calendar_id is not encrypted, save via general settings API instead
    } catch (encryptError: any) {
      console.error('Encryption error:', encryptError)
      return NextResponse.json({
        error: 'Failed to encrypt secrets',
        details: encryptError.message
      }, { status: 500 })
    }

    // Update database using direct PostgreSQL to bypass PostgREST schema cache
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'No secrets to update' }, { status: 200 })
    }

    const pool = getDbPool()
    let client

    try {
      client = await pool.connect()

      // Build SET clause dynamically
      const setClauses = Object.keys(updates).map((key, index) => `"${key}" = $${index + 2}`)
      const values = Object.values(updates)

      const sql = `
        UPDATE businesses
        SET ${setClauses.join(', ')}, updated_at = NOW()
        WHERE id = $1
      `

      await client.query(sql, [params.id, ...values])

      return NextResponse.json({ message: 'Secrets saved successfully', updated: Object.keys(updates).length })
    } catch (dbError: any) {
      console.error('Database error:', dbError)
      return NextResponse.json({
        error: 'Failed to save secrets',
        details: dbError.message
      }, { status: 500 })
    } finally {
      if (client) client.release()
      await pool.end()
    }
  })
}
