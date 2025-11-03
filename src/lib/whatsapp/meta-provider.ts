/**
 * Meta WhatsApp Business API Provider
 */

import crypto from 'crypto'
import axios from 'axios'
import {
  WhatsAppProvider,
  WhatsAppMessage,
  WhatsAppIncomingMessage,
  WhatsAppProviderConfig,
} from './provider.interface'

export class MetaWhatsAppProvider implements WhatsAppProvider {
  private phoneNumberId: string
  private accessToken: string
  private verifyToken: string
  private appSecret: string

  constructor(config: NonNullable<WhatsAppProviderConfig['meta']>) {
    this.phoneNumberId = config.phoneNumberId
    this.accessToken = config.accessToken
    this.verifyToken = config.verifyToken
    this.appSecret = config.appSecret
  }

  getName(): 'meta' {
    return 'meta'
  }

  async sendMessage(params: WhatsAppMessage): Promise<{ messageId: string; success: boolean }> {
    try {
      const url = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`

      const payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: params.to.replace(/\D/g, ''), // Remove non-digits
        type: 'text',
        text: {
          preview_url: false,
          body: params.body,
        },
      }

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      return {
        messageId: response.data.messages[0].id,
        success: true,
      }
    } catch (error: any) {
      console.error('Meta WhatsApp send error:', error.response?.data || error.message)
      throw new Error(`Failed to send WhatsApp message: ${error.message}`)
    }
  }

  verifyWebhook(payload: any, signature: string): boolean {
    // Verify webhook signature using app secret
    const expectedSignature = crypto
      .createHmac('sha256', this.appSecret)
      .update(JSON.stringify(payload))
      .digest('hex')

    return signature === `sha256=${expectedSignature}`
  }

  parseIncomingMessage(payload: any): WhatsAppIncomingMessage | null {
    try {
      // Meta webhook structure
      const entry = payload.entry?.[0]
      const changes = entry?.changes?.[0]
      const value = changes?.value

      if (!value?.messages?.[0]) {
        return null
      }

      const message = value.messages[0]
      const from = message.from

      // Handle different message types
      let body = ''
      let mediaUrl: string | undefined

      if (message.type === 'text') {
        body = message.text.body
      } else if (message.type === 'image') {
        body = message.image.caption || '[Image]'
        mediaUrl = message.image.id // You'd need to fetch the actual URL separately
      } else if (message.type === 'audio') {
        body = '[Voice Message]'
        mediaUrl = message.audio.id
      }

      return {
        from,
        body,
        messageId: message.id,
        timestamp: parseInt(message.timestamp) * 1000, // Convert to milliseconds
        mediaUrl,
      }
    } catch (error) {
      console.error('Error parsing Meta webhook:', error)
      return null
    }
  }

  /**
   * Verify webhook GET request (for Meta setup)
   */
  verifyWebhookGet(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.verifyToken) {
      return challenge
    }
    return null
  }
}
