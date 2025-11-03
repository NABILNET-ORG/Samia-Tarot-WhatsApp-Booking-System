/**
 * WhatsApp Provider Factory
 * Creates the appropriate provider based on configuration
 */

import { WhatsAppProvider, WhatsAppProviderConfig } from './provider.interface'
import { MetaWhatsAppProvider } from './meta-provider'
import { TwilioWhatsAppProvider } from './twilio-provider'

export class WhatsAppProviderFactory {
  static create(config: WhatsAppProviderConfig): WhatsAppProvider {
    switch (config.provider) {
      case 'meta':
        if (!config.meta) {
          throw new Error('Meta configuration is required when provider is "meta"')
        }
        return new MetaWhatsAppProvider(config.meta)

      case 'twilio':
        if (!config.twilio) {
          throw new Error('Twilio configuration is required when provider is "twilio"')
        }
        return new TwilioWhatsAppProvider(config.twilio)

      default:
        throw new Error(`Unknown WhatsApp provider: ${config.provider}`)
    }
  }

  /**
   * Create provider from environment variables
   */
  static createFromEnv(): WhatsAppProvider {
    const provider = (process.env.WHATSAPP_PROVIDER || 'meta') as 'meta' | 'twilio'

    const config: WhatsAppProviderConfig = {
      provider,
      meta:
        provider === 'meta'
          ? {
              phoneNumberId: process.env.META_WHATSAPP_PHONE_ID!,
              accessToken: process.env.META_WHATSAPP_TOKEN!,
              verifyToken: process.env.META_WHATSAPP_VERIFY_TOKEN!,
              appSecret: process.env.META_APP_SECRET!,
            }
          : undefined,
      twilio:
        provider === 'twilio'
          ? {
              accountSid: process.env.TWILIO_ACCOUNT_SID!,
              authToken: process.env.TWILIO_AUTH_TOKEN!,
              whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER!,
            }
          : undefined,
    }

    return this.create(config)
  }
}

// Singleton instance
let providerInstance: WhatsAppProvider | null = null

export function getWhatsAppProvider(): WhatsAppProvider {
  if (!providerInstance) {
    providerInstance = WhatsAppProviderFactory.createFromEnv()
  }
  return providerInstance
}

// Reset provider (useful when changing configuration)
export function resetWhatsAppProvider(): void {
  providerInstance = null
}
