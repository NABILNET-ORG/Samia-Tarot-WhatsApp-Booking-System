/**
 * 🔐 Google OAuth Callback Handler
 * Process OAuth code and store tokens
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(`${request.nextUrl.origin}/dashboard/settings?google_error=${error}`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${request.nextUrl.origin}/dashboard/settings?google_error=missing_code`)
    }

    // Parse state
    const stateData = JSON.parse(state)
    const { business_id, employee_id, scope } = stateData

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${request.nextUrl.origin}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokens)
      return NextResponse.redirect(`${request.nextUrl.origin}/dashboard/settings?google_error=token_exchange_failed`)
    }

    // Store tokens in business secrets (encrypted)
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('google_access_token, google_refresh_token')
      .eq('id', business_id)
      .single()

    // Update business with Google tokens
    await supabaseAdmin
      .from('businesses')
      .update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        google_scope: scope,
      })
      .eq('id', business_id)

    // Log the connection
    await supabaseAdmin.from('activity_logs').insert({
      business_id,
      employee_id,
      action: 'google.oauth_connected',
      resource_type: 'integration',
      resource_id: business_id,
      details: { scope, scopes: tokens.scope },
    })

    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard/settings?google_success=true&scope=${scope}`)
  } catch (error: any) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard/settings?google_error=callback_failed`)
  }
}
