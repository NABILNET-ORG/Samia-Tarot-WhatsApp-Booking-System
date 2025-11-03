/**
 * WhatsApp Provider Interface
 * Abstraction layer for Meta and Twilio WhatsApp APIs
 */

export interface WhatsAppMessage {
  to: string
  body: string
  mediaUrl?: string
}

export interface WhatsAppIncomingMessage {
  from: string
  body: string
  messageId: string
  timestamp: number
  mediaUrl?: string
}

export interface WhatsAppProvider {
  /**
   * Send a text message
   */
  sendMessage(params: WhatsAppMessage): Promise<{ messageId: string; success: boolean }>

  /**
   * Verify webhook signature
   */
  verifyWebhook(payload: any, signature: string): boolean

  /**
   * Parse incoming webhook payload
   */
  parseIncomingMessage(payload: any): WhatsAppIncomingMessage | null

  /**
   * Get provider name
   */
  getName(): 'meta' | 'twilio'
}

export interface WhatsAppProviderConfig {
  provider: 'meta' | 'twilio'
  meta?: {
    phoneNumberId: string
    accessToken: string
    verifyToken: string
    appSecret: string
  }
  twilio?: {
    accountSid: string
    authToken: string
    whatsappNumber: string
  }
}
