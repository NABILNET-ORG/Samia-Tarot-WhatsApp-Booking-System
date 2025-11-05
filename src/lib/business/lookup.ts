/**
 * 🏢 Business Lookup Utilities
 * Find business by WhatsApp phone number
 */

import { supabaseAdmin } from '@/lib/supabase/client'

/**
 * Find business by WhatsApp phone number
 * Used by webhook to route incoming messages to correct business
 */
export async function findBusinessByPhone(phoneNumber: string): Promise<string | null> {
  try {
    // Normalize phone number (remove non-digits)
    const normalized = phoneNumber.replace(/\D/g, '')

    // Try exact match first
    let { data: business } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('whatsapp_number', phoneNumber)
      .eq('is_active', true)
      .single()

    if (business) {
      return business.id
    }

    // Try normalized match
    const { data: businesses } = await supabaseAdmin
      .from('businesses')
      .select('id, whatsapp_number')
      .eq('is_active', true)

    if (businesses) {
      for (const biz of businesses) {
        const bizNormalized = biz.whatsapp_number?.replace(/\D/g, '') || ''
        if (bizNormalized === normalized) {
          return biz.id
        }
      }
    }

    // Default to first business (for single-tenant compatibility)
    const { data: firstBusiness } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single()

    return firstBusiness?.id || null
  } catch (error) {
    console.error('Business lookup error:', error)
    return null
  }
}

/**
 * Get business by slug
 */
export async function getBusinessBySlug(slug: string): Promise<any | null> {
  try {
    const { data } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    return data
  } catch (error) {
    return null
  }
}
