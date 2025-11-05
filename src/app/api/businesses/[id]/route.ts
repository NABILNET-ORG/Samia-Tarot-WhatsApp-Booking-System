/**
 * 🏢 Single Business API
 * GET/PATCH/DELETE specific business
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext, requirePermission } from '@/lib/multi-tenant/middleware'
import { encryptApiKey, decryptBusinessKeys } from '@/lib/encryption/keys'

type RouteParams = {
  params: { id: string }
}

/**
 * GET /api/businesses/[id] - Get business by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { id } = params

      // Only allow fetching own business unless super admin
      if (context.business.id !== id && context.employee.role_name !== 'super_admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const { data: business, error } = await supabaseAdmin
        .from('businesses')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !business) {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 })
      }

      // Decrypt sensitive keys for authorized users
      const decrypted = decryptBusinessKeys(business)

      return NextResponse.json({ business: decrypted })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to fetch business', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * PATCH /api/businesses/[id] - Update business
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return requirePermission(request, 'businesses', 'update', async (context) => {
    try {
      const { id } = params
      const body = await request.json()

      // Only allow updating own business unless super admin
      if (context.business.id !== id && context.employee.role_name !== 'super_admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const updates: any = {}
      const encryptedUpdates: any = {}

      // Handle non-sensitive updates
      const allowedFields = [
        'name', 'industry', 'whatsapp_number', 'whatsapp_provider',
        'timezone', 'logo_url', 'meta_phone_number_id', 'meta_verify_token',
        'stripe_publishable_key', 'google_client_id', 'openai_model',
        'subscription_tier', 'is_active', 'is_suspended'
      ]

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updates[field] = body[field]
        }
      }

      // Handle sensitive API keys (encrypt)
      if (body.meta_access_token) {
        encryptedUpdates.meta_access_token_encrypted = encryptApiKey(body.meta_access_token, id)
      }
      if (body.meta_app_secret) {
        encryptedUpdates.meta_app_secret_encrypted = encryptApiKey(body.meta_app_secret, id)
      }
      if (body.twilio_account_sid) {
        encryptedUpdates.twilio_account_sid_encrypted = encryptApiKey(body.twilio_account_sid, id)
      }
      if (body.twilio_auth_token) {
        encryptedUpdates.twilio_auth_token_encrypted = encryptApiKey(body.twilio_auth_token, id)
      }
      if (body.openai_api_key) {
        encryptedUpdates.openai_api_key_encrypted = encryptApiKey(body.openai_api_key, id)
      }
      if (body.stripe_secret_key) {
        encryptedUpdates.stripe_secret_key_encrypted = encryptApiKey(body.stripe_secret_key, id)
      }
      if (body.google_client_secret) {
        encryptedUpdates.google_client_secret_encrypted = encryptApiKey(body.google_client_secret, id)
      }
      if (body.google_refresh_token) {
        encryptedUpdates.google_refresh_token_encrypted = encryptApiKey(body.google_refresh_token, id)
      }

      const allUpdates = { ...updates, ...encryptedUpdates }

      if (Object.keys(allUpdates).length === 0) {
        return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
      }

      const { data: business, error } = await supabaseAdmin
        .from('businesses')
        .update(allUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ business, message: 'Business updated successfully' })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to update business', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * DELETE /api/businesses/[id] - Soft delete business
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return requirePermission(request, 'businesses', 'delete', async (context) => {
    try {
      const { id } = params

      // Only super admin can delete businesses
      if (context.employee.role_name !== 'super_admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Soft delete (suspend instead of actual delete)
      const { error } = await supabaseAdmin
        .from('businesses')
        .update({
          is_active: false,
          is_suspended: true,
          suspended_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      return NextResponse.json({ message: 'Business suspended successfully' })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to delete business', message: error.message },
        { status: 500 }
      )
    }
  })
}
