/**
 * 🔐 Reset Password API
 * Verify token and set new password
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { hashPassword } from '@/lib/auth/session'
import { validatePassword } from '@/lib/validation/password'

/**
 * POST /api/auth/reset-password
 * Reset password using token from email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, new_password } = body

    // Validate inputs
    if (!token || !new_password) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      )
    }

    // Validate token format (should be 64 hex chars)
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      )
    }

    // Validate password complexity
    const passwordValidation = validatePassword(new_password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: 'Password does not meet requirements',
          details: passwordValidation.errors,
        },
        { status: 400 }
      )
    }

    // Find valid reset token
    const { data: resetToken } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (!resetToken) {
      return NextResponse.json(
        {
          error: 'Invalid or expired token',
          message: 'This password reset link is invalid or has expired. Please request a new one.',
        },
        { status: 400 }
      )
    }

    // Get employee
    const { data: employee } = await supabaseAdmin
      .from('employees')
      .select('id, email, is_active')
      .eq('id', resetToken.employee_id)
      .single()

    if (!employee || !employee.is_active) {
      return NextResponse.json(
        { error: 'Employee account not found or inactive' },
        { status: 404 }
      )
    }

    // Hash new password
    const password_hash = await hashPassword(new_password)

    // Update employee password
    const { error: updateError } = await supabaseAdmin
      .from('employees')
      .update({ password_hash })
      .eq('id', employee.id)

    if (updateError) {
      console.error('Failed to update password:', updateError)
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      )
    }

    // Mark token as used
    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token)

    // Invalidate all existing sessions for this employee
    const { error: sessionError } = await supabaseAdmin
      .from('active_sessions')
      .delete()
      .eq('employee_id', employee.id)

    if (sessionError) {
      console.error('Failed to invalidate sessions:', sessionError)
      // Don't fail the request, but log the error
    } else {
      console.log(`✅ Invalidated all sessions for employee: ${employee.email}`)
    }

    console.log(`✅ Password reset successful for employee: ${employee.email}`)

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    })
  } catch (error: any) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password', message: error.message },
      { status: 500 }
    )
  }
}
