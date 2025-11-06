/**
 * 🏢 Multi-Tenant WhatsApp Provider
 * Creates provider instances per business using decrypted credentials
 */

import { WhatsAppProvider } from './provider.interface'
import { MetaWhatsAppProvider } from './meta-provider'
import { TwilioWhatsAppProvider } from './twilio-provider'
import { supabaseAdmin } from '@/lib/supabase/client'
import { decryptApiKey } from '@/lib/encryption/keys'

type MetaConfig = {
  phoneNumberId: string
  accessToken: string
  verifyToken: string
  appSecret: string
}

type TwilioConfig = {
  accountSid: string
  authToken: string
  whatsappNumber: string
}

// Cache providers per business (in-memory)
const providerCache = new Map<string, WhatsAppProvider>()

/**
 * Get WhatsApp provider for a specific business
 * Loads credentials from database and creates appropriate provider
 */
export async function getWhatsAppProviderForBusiness(
  businessId: string
): Promise<WhatsAppProvider> {
  // Check cache first
  if (providerCache.has(businessId)) {
    return providerCache.get(businessId)!
  }

  // Load business from database
  const { data: business, error } = await supabaseAdmin
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single()

  if (error || !business) {
    throw new Error(`Business not found: ${businessId}`)
  }

  // Build provider config
  const providerType = business.whatsapp_provider || 'meta'

  if (providerType === 'meta') {
    // Decrypt Meta credentials (with fallback to env vars)
    let accessToken = ''
    let appSecret = ''
    let verifyToken = ''

    try {
      accessToken = business.meta_access_token_encrypted
        ? decryptApiKey(business.meta_access_token_encrypted, businessId)
        : process.env.META_WHATSAPP_TOKEN || ''

      appSecret = business.meta_app_secret_encrypted
        ? decryptApiKey(business.meta_app_secret_encrypted, businessId)
        : process.env.META_APP_SECRET || ''

      verifyToken = business.meta_verify_token_encrypted
        ? decryptApiKey(business.meta_verify_token_encrypted, businessId)
        : process.env.META_WHATSAPP_VERIFY_TOKEN || ''
    } catch (error) {
      console.warn('Failed to decrypt Meta credentials, using env vars fallback:', error)
      accessToken = process.env.META_WHATSAPP_TOKEN || ''
      appSecret = process.env.META_APP_SECRET || ''
      verifyToken = process.env.META_WHATSAPP_VERIFY_TOKEN || ''
    }

    const metaConfig: MetaConfig = {
      phoneNumberId: business.whatsapp_phone_number_id || business.meta_phone_id || process.env.META_WHATSAPP_PHONE_ID || '',
      accessToken,
      verifyToken,
      appSecret,
    }

    console.log('🔧 Meta config:', { phoneNumberId: metaConfig.phoneNumberId, hasToken: !!metaConfig.accessToken })

    const provider = new MetaWhatsAppProvider(metaConfig)
    providerCache.set(businessId, provider)
    return provider
  } else {
    // Decrypt Twilio credentials
    const accountSid = business.twilio_account_sid_encrypted
      ? decryptApiKey(business.twilio_account_sid_encrypted, businessId)
      : process.env.TWILIO_ACCOUNT_SID || ''

    const authToken = business.twilio_auth_token_encrypted
      ? decryptApiKey(business.twilio_auth_token_encrypted, businessId)
      : process.env.TWILIO_AUTH_TOKEN || ''

    const twilioConfig: TwilioConfig = {
      accountSid,
      authToken,
      whatsappNumber: business.twilio_whatsapp_number || process.env.TWILIO_WHATSAPP_NUMBER || '',
    }

    const provider = new TwilioWhatsAppProvider(twilioConfig)
    providerCache.set(businessId, provider)
    return provider
  }
}

/**
 * Clear provider cache (useful when business credentials change)
 */
export function clearProviderCache(businessId?: string): void {
  if (businessId) {
    providerCache.delete(businessId)
  } else {
    providerCache.clear()
  }
}

/**
 * Send message using business's WhatsApp provider
 */
export async function sendWhatsAppMessage(
  businessId: string,
  to: string,
  message: string,
  options?: {
    mediaUrl?: string
    mediaType?: 'image' | 'video' | 'audio' | 'document'
  }
): Promise<{ messageId: string; status: string }> {
  try {
    console.log(`📤 Sending WhatsApp message to ${to} via business ${businessId}`)
    const provider = await getWhatsAppProviderForBusiness(businessId)

    const result = await provider.sendMessage({
      to,
      body: message,
      mediaUrl: options?.mediaUrl,
    })

    console.log(`✅ WhatsApp message sent: ${result.messageId}`)

    return {
      messageId: result.messageId,
      status: result.success ? 'sent' : 'failed',
    }
  } catch (error: any) {
    console.error('❌ Failed to send WhatsApp message:', error)
    throw error
  }
}
