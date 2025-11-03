/**
 * 💳 Payment Handler
 * Complete payment processing with Stripe and Western Union
 */

import { getWhatsAppProvider } from '@/lib/whatsapp/factory'
import { StripeHelpers } from '@/lib/stripe/client'
import { supabaseAdmin, supabaseHelpers } from '@/lib/supabase/client'
import { ServiceHelpers, Service } from '@/lib/supabase/services'

export class PaymentHandler {
  /**
   * Create and send Stripe checkout link
   */
  static async createStripeCheckout(
    customer: any,
    service: Service,
    language: 'ar' | 'en'
  ): Promise<void> {
    try {
      const provider = getWhatsAppProvider()

      // Create Stripe checkout session
      const checkout = await StripeHelpers.createCheckoutSession({
        customerId: customer.id,
        customerEmail: customer.email || 'noreply@samiatarot.com',
        customerName: customer.name_english || customer.name_arabic || 'Customer',
        serviceId: service.id,
        serviceName: service.name_english,
        amount: service.price,
        language,
      })

      // Create pending booking in database
      const { data: booking, error } = await supabaseAdmin
        .from('bookings')
        .insert({
          customer_id: customer.id,
          phone: customer.phone,
          service_id: service.id,
          service_name: service.name_english,
          service_type: service.service_type,
          service_tier: service.service_tier,
          service_duration: service.duration_minutes,
          amount: service.price,
          currency: 'USD',
          payment_method: 'stripe',
          payment_status: 'pending',
          stripe_checkout_session_id: checkout.sessionId,
          status: 'pending',
          language,
          booking_started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create booking: ${error.message}`)
      }

      // Send payment link via WhatsApp
      const message =
        language === 'ar'
          ? `🔗 رابط الدفع الآمن:\n\n${checkout.url}\n\n💳 الدفع آمن ومشفر عبر Stripe\n✅ نقبل جميع البطاقات الائتمانية\n\n🔮 الخدمة: ${service.name_arabic}\n💰 المبلغ: $${service.price}\n\nبعد إتمام الدفع، سيتم تأكيد حجزك تلقائياً!`
          : `🔗 Secure Payment Link:\n\n${checkout.url}\n\n💳 Secure encrypted payment via Stripe\n✅ All major credit cards accepted\n\n🔮 Service: ${service.name_english}\n💰 Amount: $${service.price}\n\nYour booking will be confirmed automatically after payment!`

      await provider.sendMessage({
        to: customer.phone,
        body: message,
      })

      console.log(`✅ Stripe checkout created: ${checkout.sessionId}`)
      console.log(`✅ Payment link sent to ${customer.phone}`)
    } catch (error: any) {
      console.error('Stripe checkout error:', error)
      throw error
    }
  }

  /**
   * Send Western Union instructions
   */
  static async sendWesternUnionInstructions(
    customer: any,
    service: Service,
    language: 'ar' | 'en'
  ): Promise<void> {
    const provider = getWhatsAppProvider()

    const receiverName = process.env.WU_RECEIVER_NAME || 'Mohamad Nabil Zein'
    const receiverPhone = process.env.WU_RECEIVER_PHONE || '+9613620860'
    const receiverCountry = process.env.WU_RECEIVER_COUNTRY || 'Lebanon'

    const message =
      language === 'ar'
        ? `💰 تعليمات الدفع عبر ويسترن يونيون:\n\n` +
          `📍 معلومات المستلم:\n` +
          `👤 الاسم: ${receiverName}\n` +
          `📱 الهاتف: ${receiverPhone}\n` +
          `🌍 البلد: ${receiverCountry}\n` +
          `💵 المبلغ: $${service.price} USD\n\n` +
          `🔮 الخدمة: ${service.name_arabic}\n\n` +
          `📋 الخطوات:\n` +
          `1. اذهب إلى أقرب فرع ويسترن يونيون\n` +
          `2. أرسل المبلغ باستخدام المعلومات أعلاه\n` +
          `3. احصل على رقم MTCN\n` +
          `4. أرسل لي رقم MTCN هنا\n\n` +
          `بعد التحقق من الدفع، سيتم تأكيد حجزك!`
        : `💰 Western Union Payment Instructions:\n\n` +
          `📍 Receiver Information:\n` +
          `👤 Name: ${receiverName}\n` +
          `📱 Phone: ${receiverPhone}\n` +
          `🌍 Country: ${receiverCountry}\n` +
          `💵 Amount: $${service.price} USD\n\n` +
          `🔮 Service: ${service.name_english}\n\n` +
          `📋 Steps:\n` +
          `1. Go to nearest Western Union branch\n` +
          `2. Send money using above information\n` +
          `3. Get MTCN number\n` +
          `4. Send me the MTCN number here\n\n` +
          `After payment verification, your booking will be confirmed!`

    await provider.sendMessage({
      to: customer.phone,
      body: message,
    })

    // Create pending booking
    await supabaseAdmin.from('bookings').insert({
      customer_id: customer.id,
      phone: customer.phone,
      service_id: service.id,
      service_name: service.name_english,
      service_type: service.service_type,
      service_tier: service.service_tier,
      amount: service.price,
      currency: 'USD',
      payment_method: 'western_union',
      payment_status: 'pending',
      status: 'pending',
      language,
      booking_started_at: new Date().toISOString(),
    })

    console.log(`✅ Western Union instructions sent to ${customer.phone}`)
  }

  /**
   * Calculate delivery date based on service tier
   */
  static calculateDeliveryDate(service: Service, paymentTime: Date = new Date()): Date {
    const deliveryDate = new Date(paymentTime)
    const paymentHour = paymentTime.getHours()
    const isAfter7PM = paymentHour >= 19

    // Calculate days to add
    let daysToAdd = service.delivery_days || 0

    // For same-day services, check time
    if (service.delivery_days === 0) {
      if (isAfter7PM) {
        daysToAdd = 1 // Next day
      }
    } else if (isAfter7PM) {
      daysToAdd += 1 // Add extra day
    }

    deliveryDate.setDate(deliveryDate.getDate() + daysToAdd)
    deliveryDate.setHours(22, 0, 0, 0) // 10 PM

    return deliveryDate
  }
}
