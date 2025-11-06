/**
 * 📋 Zod Validation Schemas
 * Input validation for all API resources
 */

import { z } from 'zod'

// Phone number regex (international format)
const phoneRegex = /^\+?[1-9]\d{1,14}$/

// ==================== CUSTOMER SCHEMAS ====================

export const CustomerSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Invalid phone number format'),
  name_english: z.string().min(1).max(100).trim().optional(),
  name_arabic: z.string().min(1).max(100).trim().optional(),
  email: z.string().email().max(255).toLowerCase().optional(),
  preferred_language: z.enum(['en', 'ar', 'auto']).default('auto'),
  vip_status: z.boolean().default(false),
  notes: z.string().max(1000).trim().optional(),
})

export const UpdateCustomerSchema = CustomerSchema.partial()

// ==================== SERVICE SCHEMAS ====================

export const ServiceSchema = z.object({
  name_english: z.string().min(1).max(200).trim(),
  name_arabic: z.string().min(1).max(200).trim(),
  description_english: z.string().max(1000).trim(),
  description_arabic: z.string().max(1000).trim(),
  price: z.number().positive().max(999999),
  duration_minutes: z.number().int().positive().max(1440).optional(),
  is_active: z.boolean().default(true),
  service_type: z.enum(['reading', 'call', 'other']).default('reading'),
  tier: z.enum(['standard', 'premium', 'golden']).optional(),
})

export const UpdateServiceSchema = ServiceSchema.partial()

// ==================== BOOKING SCHEMAS ====================

export const BookingSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  service_id: z.string().uuid('Invalid service ID'),
  scheduled_at: z.string().datetime('Invalid datetime format'),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).default('pending'),
  payment_status: z.enum(['pending', 'paid', 'refunded']).default('pending'),
  notes: z.string().max(500).trim().optional(),
})

export const UpdateBookingSchema = BookingSchema.partial()

// ==================== EMPLOYEE SCHEMAS ====================

export const EmployeeSchema = z.object({
  email: z.string().email().max(255).toLowerCase(),
  full_name: z.string().min(1).max(100).trim(),
  role_id: z.string().uuid(),
  temporary_password: z.string().min(12),
  custom_permissions_json: z.record(z.any()).optional(),
})

export const UpdateEmployeeSchema = z.object({
  full_name: z.string().min(1).max(100).trim().optional(),
  role_id: z.string().uuid().optional(),
  is_active: z.boolean().optional(),
  custom_permissions_json: z.record(z.any()).optional(),
})

// ==================== TEMPLATE SCHEMAS ====================

export const TemplateSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).trim().optional(),
  prompt_text: z.string().min(10).max(5000).trim(),
  category: z.enum(['general', 'greeting', 'booking', 'payment', 'support']).default('general'),
  is_active: z.boolean().default(true),
})

export const UpdateTemplateSchema = TemplateSchema.partial()

// ==================== CANNED RESPONSE SCHEMAS ====================

export const CannedResponseSchema = z.object({
  title: z.string().min(1).max(100).trim(),
  content: z.string().min(1).max(1000).trim(),
  category: z.enum(['general', 'greeting', 'booking', 'payment', 'support']).default('general'),
  shortcut: z.string().max(20).trim().optional(),
})

export const UpdateCannedResponseSchema = CannedResponseSchema.partial()

// ==================== BUSINESS SCHEMAS ====================

export const BusinessSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  slug: z.string().min(3).max(50).toLowerCase().regex(/^[a-z0-9-]+$/),
  email: z.string().email().max(255).toLowerCase(),
  phone: z.string().regex(phoneRegex),
  timezone: z.string().max(50).default('UTC'),
  subscription_plan: z.enum(['free', 'starter', 'pro', 'enterprise']).default('free'),
  whatsapp_phone_number_id: z.string().max(50).optional(),
  twilio_phone_number: z.string().regex(phoneRegex).optional(),
})

export const UpdateBusinessSchema = BusinessSchema.partial()

// ==================== MESSAGE SCHEMAS ====================

export const MessageSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1).max(10000).trim(),
  message_type: z.enum(['text', 'voice', 'image', 'document']).default('text'),
  media_url: z.string().url().optional(),
})

// ==================== CONVERSATION SCHEMAS ====================

export const ConversationSchema = z.object({
  customer_id: z.string().uuid().optional(),
  phone: z.string().regex(phoneRegex),
  mode: z.enum(['ai', 'human', 'hybrid']).default('ai'),
  assigned_employee_id: z.string().uuid().optional(),
})

// ==================== SANITIZATION HELPERS ====================

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitize text input (trim, remove control characters)
 */
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .substring(0, 10000) // Max length
}

/**
 * Validate and parse with Zod schema
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors = result.error.errors.map(err =>
    `${err.path.join('.')}: ${err.message}`
  )

  return { success: false, errors }
}
