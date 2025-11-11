/**
 * 📋 Zod Validation Schemas
 * Input validation for all API resources
 */

import { z } from 'zod'

// Phone number regex (international format)
const phoneRegex = /^\+?[1-9]\d{1,14}$/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ==================== AUTHENTICATION SCHEMAS ====================

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(32, 'Invalid token'),
  new_password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

export const SendVerificationSchema = z.object({
  email: z.string().email().max(255).optional(),
})

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
  custom_permissions_json: z.record(z.string(), z.any()).optional(),
})

export const UpdateEmployeeSchema = z.object({
  full_name: z.string().min(1).max(100).trim().optional(),
  role_id: z.string().uuid().optional(),
  is_active: z.boolean().optional(),
  custom_permissions_json: z.record(z.string(), z.any()).optional(),
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

export const UpdateMessageSchema = z.object({
  content: z.string().min(1).max(10000).trim().optional(),
  is_read: z.boolean().optional(),
})

// ==================== CONVERSATION SCHEMAS ====================

export const ConversationSchema = z.object({
  customer_id: z.string().uuid().optional(),
  phone: z.string().regex(phoneRegex),
  mode: z.enum(['ai', 'human', 'hybrid']).default('ai'),
  assigned_employee_id: z.string().uuid().optional(),
})

export const UpdateConversationSchema = z.object({
  mode: z.enum(['ai', 'human', 'hybrid']).optional(),
  current_state: z.string().optional(),
  is_active: z.boolean().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
})

export const TakeoverConversationSchema = z.object({
  conversation_id: z.string().uuid(),
})

// ==================== NOTIFICATION SCHEMAS ====================

export const CreateNotificationSchema = z.object({
  employee_id: z.string().uuid(),
  type: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  action_url: z.string().url().optional(),
  action_label: z.string().max(50).optional(),
  related_conversation_id: z.string().uuid().optional(),
  related_booking_id: z.string().uuid().optional(),
  related_customer_id: z.string().uuid().optional(),
})

export const MarkNotificationsReadSchema = z.object({
  notification_ids: z.array(z.string().uuid()).min(1),
})

export const PushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  p256dh_key: z.string().min(1),
  auth_key: z.string().min(1),
  device_type: z.string().optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
})

// ==================== SETTINGS SCHEMAS ====================

export const UpdateSettingsSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  support_email: z.string().email().max(255).optional(),
  support_phone: z.string().regex(phoneRegex).optional(),
  timezone: z.string().max(50).optional(),
  business_hours_start: z.string().optional(),
  business_hours_end: z.string().optional(),
  currency: z.string().max(3).optional(),
  language_primary: z.string().max(10).optional(),
  ai_model: z.string().max(50).optional(),
  ai_temperature: z.number().min(0).max(2).optional(),
  ai_max_tokens: z.number().positive().optional(),
  ai_conversation_memory: z.number().positive().optional(),
})

export const UpdateAIInstructionsSchema = z.object({
  system_prompt: z.string().max(5000).optional(),
  greeting_template: z.string().max(1000).optional(),
  tone: z.enum(['professional', 'friendly', 'mystical', 'casual']).optional(),
  language_handling: z.string().max(500).optional(),
  response_length: z.enum(['concise', 'balanced', 'detailed']).optional(),
  special_instructions: z.string().max(2000).optional(),
})

// ==================== NOTE SCHEMAS ====================

export const CreateNoteSchema = z.object({
  conversation_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  note: z.string().min(1).max(5000).trim(),
  note_type: z.enum(['general', 'warning', 'follow_up', 'reminder', 'vip']).default('general'),
  is_pinned: z.boolean().default(false),
  is_important: z.boolean().default(false),
  mentioned_employee_ids: z.array(z.string().uuid()).optional(),
}).refine(
  (data) => data.conversation_id || data.customer_id,
  { message: 'Either conversation_id or customer_id must be provided' }
)

export const UpdateNoteSchema = CreateNoteSchema.partial()

// ==================== MEDIA SCHEMAS ====================

export const UpdateMediaSchema = z.object({
  file_name: z.string().min(1).max(255).optional(),
  used_for: z.string().max(100).optional(),
  used_by_id: z.string().uuid().optional(),
})

// ==================== BULK OPERATIONS SCHEMAS ====================

export const BulkCustomerSchema = z.object({
  action: z.enum(['delete', 'export']),
  customer_ids: z.array(z.string().uuid()).min(1, 'At least one customer must be selected'),
})

// ==================== ADMIN SCHEMAS ====================

export const AdminProviderSchema = z.object({
  provider: z.enum(['meta', 'twilio']),
})

export const AdminServiceSchema = z.object({
  name_english: z.string().min(1).max(200),
  name_arabic: z.string().min(1).max(200),
  price: z.number().positive(),
  service_type: z.enum(['reading', 'call', 'support']).optional(),
})

// ==================== ANALYTICS SCHEMAS ====================

export const AnalyticsQuerySchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  period: z.enum(['day', 'week', 'month', 'year']).optional(),
})

export const AnalyticsExportSchema = z.object({
  type: z.enum(['conversations', 'bookings', 'revenue', 'customers']),
  format: z.enum(['csv', 'json', 'xlsx']).default('csv'),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
})

export const LogsFilterSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  action: z.string().optional(),
  status: z.string().optional(),
  source: z.string().optional(),
})

// ==================== SUBSCRIPTION SCHEMAS ====================

export const SubscriptionCheckoutSchema = z.object({
  priceId: z.string().min(1),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
})

export const SubscriptionManageSchema = z.object({
  action: z.enum(['cancel', 'update', 'resume']).optional(),
  return_url: z.string().url().optional(),
})

// ==================== VOICE SCHEMAS ====================

export const VoiceTranscribeSchema = z.object({
  audio_url: z.string().url(),
  language: z.string().default('en'),
  conversation_id: z.string().uuid().optional(),
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

  const errors = result.error.issues.map(err =>
    `${err.path.join('.')}: ${err.message}`
  )

  return { success: false, errors }
}
