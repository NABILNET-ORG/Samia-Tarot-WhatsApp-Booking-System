/**
 * 🔮 Supabase Client for Samia Tarot
 * Handles all database operations
 */

import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Create clients (will work during build even if env vars not set)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any

// Admin client (for server-side operations with full access)
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null as any

// Database types (for TypeScript)
export type Customer = {
  id: string
  phone: string
  name_english?: string
  name_arabic?: string
  email?: string
  preferred_language: 'ar' | 'en'
  country_code?: string
  first_booking_date?: string
  last_booking_date?: string
  total_bookings: number
  total_spent: number
  average_booking_value: number
  vip_status: boolean
  google_contact_id?: string
  notes?: string
  metadata?: any
  created_at: string
  updated_at: string
}

export type Conversation = {
  id: string
  customer_id?: string
  phone: string
  current_state: string
  selected_service?: number
  service_name?: string
  full_name?: string
  email?: string
  language: 'ar' | 'en'
  message_history: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>
  context_data?: any
  last_message_at: string
  expires_at: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Booking = {
  id: string
  customer_id?: string
  phone: string
  service_id: number
  service_name: string
  service_type?: 'reading' | 'call' | 'support'
  service_tier?: 'standard' | 'premium' | 'golden' | 'video'
  service_duration?: number
  amount: number
  currency: string
  payment_method?: 'stripe' | 'western_union'
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
  stripe_payment_id?: string
  stripe_checkout_session_id?: string
  western_union_mtcn?: string
  scheduled_date?: string
  delivery_date?: string
  google_calendar_event_id?: string
  google_meet_link?: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  language?: 'ar' | 'en'
  customer_notes?: string
  admin_notes?: string
  booking_started_at?: string
  booking_completed_at?: string
  cancelled_at?: string
  cancellation_reason?: string
  metadata?: any
  created_at: string
  updated_at: string
}

export type AnalyticsEvent = {
  id: string
  event_type: string
  customer_id?: string
  phone?: string
  service_id?: number
  service_name?: string
  amount?: number
  language?: 'ar' | 'en'
  metadata?: any
  session_id?: string
  created_at: string
}

export type ServicePerformance = {
  id: string
  service_id: number
  service_name: string
  date: string
  views: number
  selections: number
  bookings: number
  completed_bookings: number
  revenue: number
  conversion_rate: number
  created_at: string
  updated_at: string
}

export type WebhookLog = {
  id: string
  provider?: 'meta' | 'twilio' | 'stripe'
  event_type?: string
  payload: any
  headers?: any
  response_status?: number
  response_body?: string
  processed: boolean
  error?: string
  processing_time_ms?: number
  created_at: string
}

export type AdminNotification = {
  id: string
  notification_type: string
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  is_read: boolean
  read_at?: string
  related_booking_id?: string
  related_customer_id?: string
  metadata?: any
  created_at: string
}

export type SystemSetting = {
  id: string
  setting_key: string
  setting_value?: string
  setting_type?: 'string' | 'number' | 'boolean' | 'json'
  description?: string
  created_at: string
  updated_at: string
}

// Helper functions
export const supabaseHelpers = {
  /**
   * Get or create customer by phone
   */
  async getOrCreateCustomer(phone: string, data?: Partial<Customer>): Promise<Customer> {
    // Check if customer exists
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .single()

    if (existing && !fetchError) {
      return existing as Customer
    }

    // Create new customer
    const { data: newCustomer, error: createError } = await supabaseAdmin
      .from('customers')
      .insert({
        phone,
        preferred_language: data?.preferred_language || 'ar',
        ...data,
      })
      .select()
      .single()

    if (createError) {
      throw new Error(`Failed to create customer: ${createError.message}`)
    }

    return newCustomer as Customer
  },

  /**
   * Get active conversation for customer
   */
  async getActiveConversation(phone: string): Promise<Conversation | null> {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('phone', phone)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      throw new Error(`Failed to fetch conversation: ${error.message}`)
    }

    return data as Conversation | null
  },

  /**
   * Create or update conversation
   */
  async upsertConversation(phone: string, updates: Partial<Conversation>): Promise<Conversation> {
    const existing = await this.getActiveConversation(phone)

    if (existing) {
      // Update existing
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .update({
          ...updates,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update conversation: ${error.message}`)
      }

      return data as Conversation
    } else {
      // Create new
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .insert({
          phone,
          current_state: 'GREETING',
          language: 'ar',
          message_history: [],
          context_data: {},
          is_active: true,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          ...updates,
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create conversation: ${error.message}`)
      }

      return data as Conversation
    }
  },

  /**
   * Add message to conversation history
   */
  async addMessageToHistory(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> {
    // Get current conversation
    const { data: conversation, error: fetchError } = await supabaseAdmin
      .from('conversations')
      .select('message_history')
      .eq('id', conversationId)
      .single()

    if (fetchError) {
      throw new Error(`Failed to fetch conversation: ${fetchError.message}`)
    }

    // Add new message
    const history = (conversation?.message_history || []) as Array<any>
    history.push({
      role,
      content,
      timestamp: new Date().toISOString(),
    })

    // Keep only last 20 messages
    const trimmedHistory = history.slice(-20)

    // Update conversation
    const { error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({
        message_history: trimmedHistory,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversationId)

    if (updateError) {
      throw new Error(`Failed to update conversation history: ${updateError.message}`)
    }
  },

  /**
   * Track analytics event
   */
  async trackEvent(eventType: string, data: Partial<AnalyticsEvent>): Promise<void> {
    await supabaseAdmin.from('analytics_events').insert({
      event_type: eventType,
      ...data,
    })
  },

  /**
   * Log webhook
   */
  async logWebhook(data: Partial<WebhookLog>): Promise<void> {
    await supabaseAdmin.from('webhook_logs').insert(data)
  },

  /**
   * Create admin notification
   */
  async notifyAdmin(
    type: string,
    title: string,
    message: string,
    options?: {
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      relatedBookingId?: string
      relatedCustomerId?: string
      metadata?: any
    }
  ): Promise<void> {
    await supabaseAdmin.from('admin_notifications').insert({
      notification_type: type,
      title,
      message,
      priority: options?.priority || 'medium',
      related_booking_id: options?.relatedBookingId,
      related_customer_id: options?.relatedCustomerId,
      metadata: options?.metadata || {},
    })
  },

  /**
   * Get system setting
   */
  async getSetting(key: string): Promise<string | null> {
    const { data, error } = await supabaseAdmin
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .single()

    if (error) {
      return null
    }

    return data?.setting_value || null
  },

  /**
   * Update system setting
   */
  async updateSetting(key: string, value: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('system_settings')
      .update({ setting_value: value })
      .eq('setting_key', key)

    if (error) {
      throw new Error(`Failed to update setting: ${error.message}`)
    }
  },
}
