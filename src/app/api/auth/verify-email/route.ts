/**
 * ✅ Verify Email API
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  const { data: verifyToken } = await supabaseAdmin
    .from('email_verification_tokens')
    .select('*')
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!verifyToken) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  await supabaseAdmin
    .from('employees')
    .update({ email_verified: true, email_verified_at: new Date().toISOString() })
    .eq('id', verifyToken.employee_id)

  await supabaseAdmin
    .from('email_verification_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token)

  return NextResponse.json({ success: true, message: 'Email verified successfully' })
}
