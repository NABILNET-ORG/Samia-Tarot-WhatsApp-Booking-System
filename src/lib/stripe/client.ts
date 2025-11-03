/**
 * 💳 Stripe Client
 * Payment processing integration
 */

import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2023-10-16',
})

export type CheckoutSession = {
  sessionId: string
  url: string
  customerId: string
  serviceId: number
  amount: number
}

export const StripeHelpers = {
  /**
   * Create checkout session for booking
   */
  async createCheckoutSession(params: {
    customerId: string
    customerEmail: string
    customerName: string
    serviceId: number
    serviceName: string
    amount: number
    language: 'ar' | 'en'
  }): Promise<CheckoutSession> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://samia-tarot-app.vercel.app'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: params.serviceName,
              description:
                params.language === 'ar'
                  ? 'قراءة روحانية من سامية تاروت'
                  : 'Spiritual reading from Samia Tarot',
              images: ['https://samia-tarot-app.vercel.app/icon-512x512.png'],
            },
            unit_amount: Math.round(params.amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payment/cancel`,
      customer_email: params.customerEmail,
      metadata: {
        customer_id: params.customerId,
        service_id: params.serviceId.toString(),
        service_name: params.serviceName,
        language: params.language,
        customer_name: params.customerName,
      },
    })

    return {
      sessionId: session.id,
      url: session.url!,
      customerId: params.customerId,
      serviceId: params.serviceId,
      amount: params.amount,
    }
  },

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

    return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  },

  /**
   * Get checkout session
   */
  async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    return await stripe.checkout.sessions.retrieve(sessionId)
  },

  /**
   * Get payment intent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return await stripe.paymentIntents.retrieve(paymentIntentId)
  },
}
