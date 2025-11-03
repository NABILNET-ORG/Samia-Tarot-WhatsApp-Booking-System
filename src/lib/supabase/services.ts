/**
 * 🔮 Service Management Functions
 * All operations for managing services in database
 */

import { supabaseAdmin } from './client'

export type Service = {
  id: number
  service_key: string
  name_arabic: string
  name_english: string
  description_arabic?: string
  description_english?: string
  short_desc_arabic?: string
  short_desc_english?: string
  price: number
  original_price?: number
  currency: string
  service_type: 'reading' | 'call' | 'support'
  service_tier: 'standard' | 'premium' | 'golden' | 'video'
  duration_minutes?: number
  delivery_days: number
  is_active: boolean
  is_featured: boolean
  sort_order: number
  max_daily_bookings?: number
  stock_available?: number
  tags: string[]
  image_url?: string
  icon_emoji?: string
  metadata?: any
  created_at: string
  updated_at: string
}

export const ServiceHelpers = {
  /**
   * Get all active services
   */
  async getActiveServices(language?: 'ar' | 'en'): Promise<Service[]> {
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })

    if (error) {
      throw new Error(`Failed to get services: ${error.message}`)
    }

    return data as Service[]
  },

  /**
   * Get service by ID
   */
  async getServiceById(id: number): Promise<Service | null> {
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get service: ${error.message}`)
    }

    return data as Service | null
  },

  /**
   * Get service by key
   */
  async getServiceByKey(key: string): Promise<Service | null> {
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('service_key', key)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get service: ${error.message}`)
    }

    return data as Service | null
  },

  /**
   * Get services by type
   */
  async getServicesByType(type: 'reading' | 'call' | 'support'): Promise<Service[]> {
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('service_type', type)
      .eq('is_active', true)
      .order('sort_order')

    if (error) {
      throw new Error(`Failed to get services by type: ${error.message}`)
    }

    return data as Service[]
  },

  /**
   * Get featured services
   */
  async getFeaturedServices(): Promise<Service[]> {
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('is_featured', true)
      .eq('is_active', true)
      .order('sort_order')

    if (error) {
      throw new Error(`Failed to get featured services: ${error.message}`)
    }

    return data as Service[]
  },

  /**
   * Update service price
   */
  async updatePrice(
    serviceId: number,
    newPrice: number,
    reason?: string
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('services')
      .update({ price: newPrice })
      .eq('id', serviceId)

    if (error) {
      throw new Error(`Failed to update price: ${error.message}`)
    }
  },

  /**
   * Enable/Disable service
   */
  async setServiceActive(serviceId: number, active: boolean): Promise<void> {
    const { error } = await supabaseAdmin
      .from('services')
      .update({ is_active: active })
      .eq('id', serviceId)

    if (error) {
      throw new Error(`Failed to update service status: ${error.message}`)
    }
  },

  /**
   * Set featured status
   */
  async setServiceFeatured(serviceId: number, featured: boolean): Promise<void> {
    const { error } = await supabaseAdmin
      .from('services')
      .update({ is_featured: featured })
      .eq('id', serviceId)

    if (error) {
      throw new Error(`Failed to update featured status: ${error.message}`)
    }
  },

  /**
   * Check service availability for today
   */
  async checkAvailability(serviceId: number): Promise<{
    available: boolean
    slotsLeft?: number
    reason?: string
  }> {
    // Get service
    const service = await this.getServiceById(serviceId)

    if (!service) {
      return { available: false, reason: 'Service not found' }
    }

    if (!service.is_active) {
      return { available: false, reason: 'Service is not active' }
    }

    // Check max daily bookings
    if (service.max_daily_bookings) {
      const { data: bookings } = await supabaseAdmin
        .from('bookings')
        .select('id')
        .eq('service_id', serviceId)
        .gte('created_at', new Date().toISOString().split('T')[0])
        .eq('payment_status', 'completed')

      const todayCount = bookings?.length || 0
      const slotsLeft = service.max_daily_bookings - todayCount

      if (slotsLeft <= 0) {
        return {
          available: false,
          reason: 'No slots available today',
          slotsLeft: 0,
        }
      }

      return {
        available: true,
        slotsLeft,
      }
    }

    // Check stock
    if (service.stock_available !== null && service.stock_available !== undefined) {
      if (service.stock_available <= 0) {
        return { available: false, reason: 'Out of stock' }
      }
    }

    return { available: true }
  },

  /**
   * Format service for display
   */
  formatForDisplay(service: Service, language: 'ar' | 'en'): {
    id: number
    name: string
    description?: string
    shortDesc?: string
    price: string
    icon?: string
    badge?: string
  } {
    const name = language === 'ar' ? service.name_arabic : service.name_english
    const description = language === 'ar' ? service.description_arabic : service.description_english
    const shortDesc = language === 'ar' ? service.short_desc_arabic : service.short_desc_english

    // Calculate badge
    let badge: string | undefined
    if (service.is_featured) {
      badge = language === 'ar' ? '⭐ مميز' : '⭐ Featured'
    } else if (service.tags.includes('new')) {
      badge = language === 'ar' ? '🆕 جديد' : '🆕 New'
    } else if (service.tags.includes('popular')) {
      badge = language === 'ar' ? '🔥 شائع' : '🔥 Popular'
    }

    // Format price
    let priceStr = `$${service.price}`
    if (service.original_price && service.original_price > service.price) {
      const discount = Math.round(((service.original_price - service.price) / service.original_price) * 100)
      priceStr = language === 'ar'
        ? `$${service.price} (وفر ${discount}%)`
        : `$${service.price} (Save ${discount}%)`
    }

    return {
      id: service.id,
      name,
      description,
      shortDesc,
      price: priceStr,
      icon: service.icon_emoji,
      badge,
    }
  },

  /**
   * Format services menu for WhatsApp
   */
  async formatMenuForWhatsApp(language: 'ar' | 'en'): Promise<string> {
    const services = await this.getActiveServices()

    let menu = language === 'ar'
      ? '🔮 **اختر الخدمة:**\n\n'
      : '🔮 **Choose Your Service:**\n\n'

    services.forEach((service, index) => {
      const formatted = this.formatForDisplay(service, language)
      const number = index + 1

      menu += `${number}. ${formatted.icon || ''} ${formatted.name}\n`
      menu += `   ${formatted.price}`

      if (formatted.badge) {
        menu += ` ${formatted.badge}`
      }

      if (formatted.shortDesc) {
        menu += `\n   _${formatted.shortDesc}_`
      }

      menu += '\n\n'
    })

    menu += language === 'ar'
      ? 'اكتب رقم الخدمة للحجز:'
      : 'Type service number to book:'

    return menu
  },

  /**
   * Get service by number from menu
   */
  async getServiceByMenuNumber(number: number): Promise<Service | null> {
    const services = await this.getActiveServices()

    if (number < 1 || number > services.length) {
      return null
    }

    return services[number - 1]
  },

  /**
   * Calculate delivery date
   */
  calculateDeliveryDate(service: Service, paymentTime: Date = new Date()): Date {
    const deliveryDate = new Date(paymentTime)

    // Check if payment is after 7 PM
    const paymentHour = paymentTime.getHours()
    const isAfter7PM = paymentHour >= 19

    // Add delivery days
    let daysToAdd = service.delivery_days

    // For same-day services (delivery_days = 0), check time
    if (service.delivery_days === 0) {
      if (isAfter7PM) {
        daysToAdd = 1 // Next day
      }
    } else if (isAfter7PM) {
      daysToAdd += 1 // Add extra day if after 7 PM
    }

    deliveryDate.setDate(deliveryDate.getDate() + daysToAdd)
    deliveryDate.setHours(22, 0, 0, 0) // 10 PM

    return deliveryDate
  },

  /**
   * Track service view (analytics)
   */
  async trackView(serviceId: number, customerId?: string, phone?: string): Promise<void> {
    await supabaseAdmin.from('analytics_events').insert({
      event_type: 'service_viewed',
      service_id: serviceId,
      customer_id: customerId,
      phone,
    })
  },

  /**
   * Track service selection
   */
  async trackSelection(serviceId: number, customerId?: string, phone?: string): Promise<void> {
    await supabaseAdmin.from('analytics_events').insert({
      event_type: 'service_selected',
      service_id: serviceId,
      customer_id: customerId,
      phone,
    })
  },

  /**
   * Get service statistics
   */
  async getServiceStats(serviceId: number, days: number = 30): Promise<{
    views: number
    selections: number
    bookings: number
    revenue: number
    conversionRate: number
  }> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get analytics events
    const { data: events } = await supabaseAdmin
      .from('analytics_events')
      .select('event_type')
      .eq('service_id', serviceId)
      .gte('created_at', startDate.toISOString())

    const views = events?.filter((e: any) => e.event_type === 'service_viewed').length || 0
    const selections = events?.filter((e: any) => e.event_type === 'service_selected').length || 0

    // Get bookings
    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('amount')
      .eq('service_id', serviceId)
      .gte('created_at', startDate.toISOString())
      .eq('payment_status', 'completed')

    const bookingCount = bookings?.length || 0
    const revenue = bookings?.reduce((sum: number, b: any) => sum + Number(b.amount), 0) || 0

    const conversionRate = views > 0 ? (bookingCount / views) * 100 : 0

    return {
      views,
      selections,
      bookings: bookingCount,
      revenue,
      conversionRate: Math.round(conversionRate * 100) / 100,
    }
  },
}
