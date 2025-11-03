/**
 * Twilio WhatsApp API Provider
 */

import twilio from 'twilio'
import {
  WhatsAppProvider,
  WhatsAppMessage,
  WhatsAppIncomingMessage,
  WhatsAppProviderConfig,
} from './provider.interface'

export class TwilioWhatsAppProvider implements WhatsAppProvider {
  private client: twilio.Twilio
  private whatsappNumber: string
  private authToken: string

  constructor(config: NonNullable<WhatsAppProviderConfig['twilio']>) {
    this.client = twilio(config.accountSid, config.authToken)
    this.whatsappNumber = config.whatsappNumber
    this.authToken = config.authToken
  }

  getName(): 'twilio' {
    return 'twilio'
  }

  async sendMessage(params: WhatsAppMessage): Promise<{ messageId: string; success: boolean }> {
    try {
      // Ensure number has whatsapp: prefix
      const to = params.to.startsWith('whatsapp:') ? params.to : `whatsapp:${params.to}`
      const from = this.whatsappNumber.startsWith('whatsapp:')
        ? this.whatsappNumber
        : `whatsapp:${this.whatsappNumber}`

      const message = await this.client.messages.create({
        body: params.body,
        from,
        to,
        ...(params.mediaUrl && { mediaUrl: [params.mediaUrl] }),
      })

      return {
        messageId: message.sid,
        success: true,
      }
    } catch (error: any) {
      console.error('Twilio WhatsApp send error:', error.message)
      throw new Error(`Failed to send WhatsApp message: ${error.message}`)
    }
  }

  verifyWebhook(payload: any, signature: string): boolean {
    // Twilio uses X-Twilio-Signature header
    // You'd pass the full URL and params to validate
    // This is a simplified version - in production, use twilio.validateRequest()
    return true // Implement proper validation in production
  }

  parseIncomingMessage(payload: any): WhatsAppIncomingMessage | null {
    try {
      // Twilio webhook sends form data
      const from = payload.From?.replace('whatsapp:', '') || payload.from?.replace('whatsapp:', '')
      const body = payload.Body || payload.body || ''
      const messageId = payload.MessageSid || payload.messageSid
      const timestamp = Date.now()

      if (!from || !messageId) {
        return null
      }

      return {
        from,
        body,
        messageId,
        timestamp,
        mediaUrl: payload.MediaUrl0 || payload.mediaUrl0,
      }
    } catch (error) {
      console.error('Error parsing Twilio webhook:', error)
      return null
    }
  }
}
