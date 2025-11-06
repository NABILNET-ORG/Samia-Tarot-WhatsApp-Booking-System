/**
 * 📧 Send Email Verification API
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { getEmployeeFromSession } from '@/lib/auth/session'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const employee = await getEmployeeFromSession(request)

    if (!employee) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (employee.email_verified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 })
    }

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await supabaseAdmin.from('email_verification_tokens').insert({
      employee_id: employee.id,
      token,
      expires_at: expiresAt.toISOString(),
    })

    const verifyUrl = `${request.nextUrl.origin}/verify-email?token=${token}`

    console.log(`
📧 EMAIL VERIFICATION
Employee: ${employee.full_name} (${employee.email})
Link: ${verifyUrl}
Expires: ${expiresAt.toLocaleString()}
    `)

    return NextResponse.json({ success: true, message: 'Verification email sent' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
  }
}
