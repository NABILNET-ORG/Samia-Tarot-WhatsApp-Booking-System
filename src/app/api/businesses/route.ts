/**
 * 🏢 Business CRUD API
 * Multi-tenant business management
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext, requirePermission } from '@/lib/multi-tenant/middleware'
import { encryptBusinessKeys } from '@/lib/encryption/keys'

/**
 * GET /api/businesses - List all businesses (super admin only)
 */
export async function GET(request: NextRequest) {
  return requirePermission(request, 'businesses', 'list', async (context) => {
    try {
      const searchParams = request.nextUrl.searchParams
      const active = searchParams.get('active')

      let query = supabaseAdmin
        .from('businesses')
        .select('*, employees(count)')
        .order('created_at', { ascending: false })

      if (active === 'true') {
        query = query.eq('is_active', true).eq('is_suspended', false)
      }

      const { data: businesses, error } = await query

      if (error) throw error

      return NextResponse.json({ businesses })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to fetch businesses', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * POST /api/businesses - Create new business
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      slug,
      industry,
      whatsapp_number,
      whatsapp_provider,
      timezone,
      logo_url,
      // API keys (will be encrypted)
      meta_access_token,
      meta_phone_number_id,
      meta_app_secret,
      meta_verify_token,
      twilio_account_sid,
      twilio_auth_token,
      openai_api_key,
      openai_model,
      stripe_publishable_key,
      stripe_secret_key,
      google_client_id,
      google_client_secret,
      google_refresh_token,
      // Subscription
      subscription_tier = 'trial',
    } = body

    // Validate required fields
    if (!name || !slug || !whatsapp_number) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, whatsapp_number' },
        { status: 400 }
      )
    }

    // Check slug uniqueness
    const { data: existing } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Slug already exists', field: 'slug' },
        { status: 409 }
      )
    }

    // Create business (without sensitive keys first)
    const { data: business, error: createError } = await supabaseAdmin
      .from('businesses')
      .insert({
        name,
        slug,
        industry,
        whatsapp_number,
        whatsapp_provider: whatsapp_provider || 'meta',
        timezone: timezone || 'America/New_York',
        logo_url,
        subscription_tier,
        subscription_status: 'active',
        is_active: true,
        is_suspended: false,
        // Unencrypted metadata
        meta_phone_number_id,
        meta_verify_token,
        stripe_publishable_key,
        google_client_id,
        openai_model: openai_model || 'gpt-4',
      })
      .select()
      .single()

    if (createError) throw createError

    // Encrypt and save API keys
    const encryptedKeys: any = {}
    
    if (meta_access_token) {
      encryptedKeys.meta_access_token_encrypted = encryptApiKey(meta_access_token, business.id)
    }
    if (meta_app_secret) {
      encryptedKeys.meta_app_secret_encrypted = encryptApiKey(meta_app_secret, business.id)
    }
    if (twilio_account_sid) {
      encryptedKeys.twilio_account_sid_encrypted = encryptApiKey(twilio_account_sid, business.id)
    }
    if (twilio_auth_token) {
      encryptedKeys.twilio_auth_token_encrypted = encryptApiKey(twilio_auth_token, business.id)
    }
    if (openai_api_key) {
      encryptedKeys.openai_api_key_encrypted = encryptApiKey(openai_api_key, business.id)
    }
    if (stripe_secret_key) {
      encryptedKeys.stripe_secret_key_encrypted = encryptApiKey(stripe_secret_key, business.id)
    }
    if (google_client_secret) {
      encryptedKeys.google_client_secret_encrypted = encryptApiKey(google_client_secret, business.id)
    }
    if (google_refresh_token) {
      encryptedKeys.google_refresh_token_encrypted = encryptApiKey(google_refresh_token, business.id)
    }

    // Update business with encrypted keys
    if (Object.keys(encryptedKeys).length > 0) {
      await supabaseAdmin
        .from('businesses')
        .update(encryptedKeys)
        .eq('id', business.id)
    }

    return NextResponse.json({
      business: {
        ...business,
        // Don't return encrypted keys
      },
      message: 'Business created successfully',
    })
  } catch (error: any) {
    console.error('Business creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create business', message: error.message },
      { status: 500 }
    )
  }
}

// Import encryption functions
import { encryptApiKey } from '@/lib/encryption/keys'
