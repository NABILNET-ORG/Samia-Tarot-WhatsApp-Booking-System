/**
 * 🔐 Session Management API
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { getEmployeeFromSession } from '@/lib/auth/session'

// GET: List active sessions
export async function GET(request: NextRequest) {
  const employee = await getEmployeeFromSession(request)
  if (!employee) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: sessions } = await supabaseAdmin
    .from('active_sessions')
    .select('*')
    .eq('employee_id', employee.id)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('last_activity_at', { ascending: false })

  return NextResponse.json({ sessions: sessions || [] })
}

// DELETE: Revoke session
export async function DELETE(request: NextRequest) {
  const employee = await getEmployeeFromSession(request)
  if (!employee) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const sessionId = searchParams.get('id')

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
  }

  await supabaseAdmin
    .from('active_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('employee_id', employee.id)

  return NextResponse.json({ success: true })
}
