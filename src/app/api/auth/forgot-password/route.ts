/**
 * 🔐 Forgot Password API
 * Request password reset via email
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { randomBytes } from 'crypto'
import { rateLimit } from '@/lib/rate-limit'
import { sendPasswordResetEmail } from '@/lib/email/resend'

/**
 * POST /api/auth/forgot-password
 * Send password reset email with secure token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Get IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

    // Rate limit: 3 requests per hour per IP (prevent email spam)
    const rateLimitResult = rateLimit(`forgot-password:${ip}`, {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
    })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many password reset requests',
          message: 'Please wait before requesting another password reset.',
        },
        { status: 429 }
      )
    }

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    // Find employee by email
    const { data: employee } = await supabaseAdmin
      .from('employees')
      .select('id, email, full_name, business_id, is_active')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    // Always return success (don't reveal if email exists - security best practice)
    const successResponse = NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    })

    if (!employee) {
      // Email doesn't exist, but don't tell the user (prevent enumeration)
      console.log(`Password reset requested for non-existent email: ${email}`)
      return successResponse
    }

    // Generate secure token (64 characters)
    const token = randomBytes(32).toString('hex')

    // Store token in database (expires in 1 hour)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    const { error: insertError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        employee_id: employee.id,
        token,
        expires_at: expiresAt.toISOString(),
        ip_address: ip,
        user_agent: request.headers.get('user-agent'),
      })

    if (insertError) {
      console.error('Failed to create reset token:', insertError)
      return NextResponse.json(
        { error: 'Failed to process password reset request' },
        { status: 500 }
      )
    }

    // Get business name for email
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('business_name')
      .eq('id', employee.business_id)
      .single()

    const businessName = business?.business_name || 'WhatsApp AI Platform'

    // Send password reset email
    try {
      await sendPasswordResetEmail(employee.email, token, businessName)
      console.log(`✅ Password reset email sent to ${employee.email}`)
    } catch (emailError: any) {
      console.error('Failed to send password reset email:', emailError)
      // Log error but still return success (don't reveal if email exists)
      console.log(`
===============================================
🔐 PASSWORD RESET REQUESTED (EMAIL FAILED)
===============================================
Employee: ${employee.full_name} (${employee.email})
Reset Token: ${token}
Expires: ${expiresAt.toLocaleString()}
Error: ${emailError.message}
===============================================
      `)
    }

    return successResponse
  } catch (error: any) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}
