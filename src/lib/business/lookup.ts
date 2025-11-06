/**
 * 🏢 Business Lookup Utilities
 * Find business by WhatsApp phone number
 */

import { supabaseAdmin } from '@/lib/supabase/client'

/**
 * Find business by WhatsApp phone number or phone ID
 * Used by webhook to route incoming messages to correct business
 */
export async function findBusinessByPhone(phoneNumber: string): Promise<string | null> {
  try {
    // Normalize phone number (remove non-digits)
    const normalized = phoneNumber.replace(/\D/g, '')

    // Try Twilio phone number match
    let { data: business } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('twilio_phone_number', phoneNumber)
      .eq('is_active', true)
      .single()

    if (business) {
      console.log('✅ Found business by Twilio phone number')
      return business.id
    }

    // Try normalized phone match
    const { data: businesses } = await supabaseAdmin
      .from('businesses')
      .select('id, twilio_phone_number')
      .eq('is_active', true)

    if (businesses) {
      for (const biz of businesses) {
        const bizNormalized = biz.twilio_phone_number?.replace(/\D/g, '') || ''
        if (bizNormalized === normalized) {
          console.log('✅ Found business by normalized phone number')
          return biz.id
        }
      }
    }

    // Default to first business (backward compatibility)
    console.warn('⚠️  No business matched phone number, using first active business')
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
 * Find business by Meta WhatsApp Phone Number ID
 * Used by Meta webhook to route messages
 */
export async function findBusinessByPhoneId(phoneNumberId: string): Promise<string | null> {
  try {
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('whatsapp_phone_number_id', phoneNumberId)
      .eq('is_active', true)
      .single()

    if (business) {
      console.log('✅ Found business by Meta phone number ID')
      return business.id
    }

    // Fallback to first business
    console.warn('⚠️  No business matched phone ID, using first active business')
    const { data: firstBusiness } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single()

    return firstBusiness?.id || null
  } catch (error) {
    console.error('Business lookup by phone ID error:', error)
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
