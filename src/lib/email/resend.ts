/**
 * 📧 Email Service using Resend
 * Transactional emails for authentication and notifications
 */

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export type EmailTemplate = 'password-reset' | 'employee-invite' | 'email-verification' | 'booking-confirmation'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

/**
 * Send email via Resend
 */
export async function sendEmail(options: EmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: options.from || process.env.EMAIL_FROM || 'noreply@samia-tarot-app.vercel.app',
      to: options.to,
      subject: options.subject,
      html: options.html,
    })

    if (error) {
      console.error('Email send error:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    console.log('✅ Email sent:', data?.id)
    return { success: true, id: data?.id }
  } catch (error: any) {
    console.error('Email error:', error)
    throw error
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetToken: string, businessName: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6B46C1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #6B46C1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>We received a request to reset your password for <strong>${businessName}</strong>.</p>
          <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 4px;">
            ${resetUrl}
          </p>
          <p><strong>If you didn't request this,</strong> you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>This is an automated email from ${businessName}</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: `Reset your password - ${businessName}`,
    html,
  })
}

/**
 * Send employee invite email
 */
export async function sendEmployeeInviteEmail(
  email: string,
  fullName: string,
  businessName: string,
  temporaryPassword: string,
  inviterName: string
) {
  const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/login`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6B46C1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .credentials { background: #fff; padding: 15px; border-left: 4px solid #6B46C1; margin: 20px 0; }
        .button { display: inline-block; background: #6B46C1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>👋 Welcome to ${businessName}!</h1>
        </div>
        <div class="content">
          <p>Hi ${fullName},</p>
          <p><strong>${inviterName}</strong> has invited you to join the <strong>${businessName}</strong> team on WhatsApp AI Platform.</p>

          <div class="credentials">
            <p><strong>Your Login Credentials:</strong></p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> <code>${temporaryPassword}</code></p>
          </div>

          <p><strong>⚠️ Important:</strong> Please change your password after your first login for security.</p>

          <p style="text-align: center;">
            <a href="${loginUrl}" class="button">Login to Dashboard</a>
          </p>

          <p>If you have any questions, contact ${inviterName} or your team admin.</p>
        </div>
        <div class="footer">
          <p>This is an automated invitation from ${businessName}</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: `You're invited to join ${businessName}`,
    html,
  })
}

/**
 * Send email verification
 */
export async function sendEmailVerificationEmail(email: string, verificationToken: string, businessName: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify-email?token=${verificationToken}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6B46C1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #6B46C1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✉️ Verify Your Email</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Please verify your email address to complete your account setup for <strong>${businessName}</strong>.</p>
          <p style="text-align: center;">
            <a href="${verifyUrl}" class="button">Verify Email Address</a>
          </p>
          <p>Or copy and paste this link:</p>
          <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 4px;">
            ${verifyUrl}
          </p>
          <p>This link will expire in 24 hours.</p>
        </div>
        <div class="footer">
          <p>This is an automated email from ${businessName}</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: `Verify your email - ${businessName}`,
    html,
  })
}
