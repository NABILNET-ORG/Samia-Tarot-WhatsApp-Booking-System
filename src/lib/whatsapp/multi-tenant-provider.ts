/**
 * 🏢 Multi-Tenant WhatsApp Provider
 * Creates provider instances per business using decrypted credentials
 */

import { WhatsAppProvider } from './provider.interface'
import { MetaWhatsAppProvider } from './meta-provider'
import { TwilioWhatsAppProvider } from './twilio-provider'
import { supabaseAdmin } from '@/lib/supabase/client'
import { decryptApiKey } from '@/lib/encryption/keys'

type BusinessWhatsAppConfig = {
  provider: 'meta' | 'twilio'
  meta?: {
    phoneNumberId: string
    accessToken: string
    verifyToken?: string
    appSecret?: string
  }
  twilio?: {
    accountSid: string
    authToken: string
    whatsappNumber: string
  }
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
  const config: BusinessWhatsAppConfig = {
    provider: business.whatsapp_provider || 'meta',
  }

  if (config.provider === 'meta') {
    // Decrypt Meta credentials
    const accessToken = business.meta_access_token_encrypted
      ? decryptApiKey(business.meta_access_token_encrypted, businessId)
      : process.env.META_WHATSAPP_TOKEN || ''

    const appSecret = business.meta_app_secret_encrypted
      ? decryptApiKey(business.meta_app_secret_encrypted, businessId)
      : process.env.META_APP_SECRET

    config.meta = {
      phoneNumberId: business.meta_phone_number_id || process.env.META_WHATSAPP_PHONE_ID || '',
      accessToken,
      verifyToken: business.meta_verify_token || process.env.META_WHATSAPP_VERIFY_TOKEN || '',
      appSecret: appSecret || '',
    }

    const provider = new MetaWhatsAppProvider(config.meta)
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

    config.twilio = {
      accountSid,
      authToken,
      whatsappNumber: business.twilio_whatsapp_number || process.env.TWILIO_WHATSAPP_NUMBER || '',
    }

    const provider = new TwilioWhatsAppProvider(config.twilio)
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
  const provider = await getWhatsAppProviderForBusiness(businessId)

  if (options?.mediaUrl) {
    return provider.sendMessage({
      to,
      message,
      mediaUrl: options.mediaUrl,
      mediaType: options.mediaType,
    })
  }

  return provider.sendMessage({ to, message })
}
