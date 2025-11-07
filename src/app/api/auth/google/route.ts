/**
 * 🔐 Google OAuth Integration
 * Initiate Google OAuth flow for Calendar & Contacts
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'

export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const searchParams = request.nextUrl.searchParams
      const scope = searchParams.get('scope') || 'calendar'

      const googleClientId = process.env.GOOGLE_CLIENT_ID
      const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`

      if (!googleClientId) {
        return NextResponse.json(
          { error: 'Google OAuth not configured' },
          { status: 500 }
        )
      }

      // Define scopes based on request
      const scopes = scope === 'contacts'
        ? ['https://www.googleapis.com/auth/contacts.readonly']
        : ['https://www.googleapis.com/auth/calendar']

      // Build Google OAuth URL
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.set('client_id', googleClientId)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', scopes.join(' '))
      authUrl.searchParams.set('access_type', 'offline')
      authUrl.searchParams.set('prompt', 'consent')
      authUrl.searchParams.set('state', JSON.stringify({
        business_id: context.business.id,
        employee_id: context.employee.id,
        scope,
      }))

      return NextResponse.json({
        auth_url: authUrl.toString(),
      })
    } catch (error: any) {
      console.error('Google OAuth error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
  })
}
