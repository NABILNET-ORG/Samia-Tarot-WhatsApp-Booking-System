/**
 * 💳 Stripe Webhook Handler
 * Processes payment confirmations and completes bookings
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { StripeHelpers } from '@/lib/stripe/client'
import { supabaseAdmin, supabaseHelpers } from '@/lib/supabase/client'
import { ServiceHelpers } from '@/lib/supabase/services'
import { PaymentHandler } from '@/lib/workflow/payment-handler'
import { getWhatsAppProvider } from '@/lib/whatsapp/factory'
import { CalendarHelpers } from '@/lib/google/calendar'
import { ContactsHelpers } from '@/lib/google/contacts'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')!

    // Verify webhook signature
    const event = StripeHelpers.verifyWebhookSignature(body, signature)

    console.log(`💳 Stripe webhook: ${event.type}`)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as any)
        break

      case 'payment_intent.succeeded':
        console.log('✅ Payment intent succeeded')
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as any)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('❌ Stripe webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

/**
 * Handle successful checkout
 */
async function handleCheckoutCompleted(session: any) {
  try {
    console.log(`🎉 Checkout completed: ${session.id}`)

    const metadata = session.metadata
    const customerId = metadata.customer_id
    const serviceId = parseInt(metadata.service_id)
    const language = metadata.language || 'en'

    // Get customer
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single()

    if (!customer) {
      throw new Error('Customer not found')
    }

    // Get service
    const service = await ServiceHelpers.getServiceById(serviceId)
    if (!service) {
      throw new Error('Service not found')
    }

    // Update booking to completed
    const { data: booking, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        payment_status: 'completed',
        status: 'confirmed',
        stripe_payment_id: session.payment_intent,
        booking_completed_at: new Date().toISOString(),
        scheduled_date: PaymentHandler.calculateDeliveryDate(service).toISOString(),
      })
      .eq('stripe_checkout_session_id', session.id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update booking: ${updateError.message}`)
    }

    console.log(`✅ Booking updated: ${booking.id}`)

    // Create calendar event for call services
    if (service.service_type === 'call' && booking.metadata?.selectedSlot) {
      try {
        console.log('📅 Creating Google Calendar event...')
        const slot = booking.metadata.selectedSlot
        const calendarEvent = await CalendarHelpers.createEvent({
          summary: `${service.name_english} - ${customer.name_english || 'Customer'}`,
          description: `Booking ID: ${booking.id}\nCustomer: ${customer.name_english || customer.name_arabic}\nPhone: ${customer.phone}\nEmail: ${customer.email || 'N/A'}`,
          startTime: new Date(slot.startTime),
          endTime: new Date(slot.endTime),
          attendeeEmail: customer.email,
          attendeeName: customer.name_english || customer.name_arabic,
        })

        // Update booking with calendar info
        await supabaseAdmin
          .from('bookings')
          .update({
            metadata: {
              ...booking.metadata,
              calendarEventId: calendarEvent.eventId,
              meetLink: calendarEvent.meetLink,
            },
          })
          .eq('id', booking.id)

        console.log(`✅ Calendar event created: ${calendarEvent.eventId}`)
        console.log(`✅ Meet link: ${calendarEvent.meetLink}`)

        // Update booking variable to include meet link for confirmation message
        booking.metadata = {
          ...booking.metadata,
          meetLink: calendarEvent.meetLink,
        }
      } catch (calendarError: any) {
        console.error('❌ Failed to create calendar event:', calendarError.message)
        // Continue with booking confirmation even if calendar fails
      }
    }

    // Save contact to Google Contacts
    try {
      console.log('👥 Saving customer contact to Google...')
      const { firstName, lastName } = ContactsHelpers.parseFullName(
        customer.name_english || customer.name_arabic || 'Customer'
      )

      const contactData = {
        firstName,
        lastName,
        nickname: customer.name_arabic, // Arabic name as nickname
        phone: customer.phone,
        email: customer.email,
        notes: `Booking: ${booking.id.substring(0, 8)} | Service: ${service.name_english} | Amount: $${service.price}`,
      }

      const savedContact = await ContactsHelpers.saveContact(contactData)
      console.log(`✅ Contact saved: ${savedContact.resourceName}`)

      // Update booking with contact info
      await supabaseAdmin
        .from('bookings')
        .update({
          metadata: {
            ...booking.metadata,
            googleContactResourceName: savedContact.resourceName,
          },
        })
        .eq('id', booking.id)
    } catch (contactError: any) {
      console.error('❌ Failed to save contact:', contactError.message)
      // Continue with booking confirmation even if contact save fails
    }

    // Track payment completed
    await supabaseHelpers.trackEvent('payment_completed', {
      customer_id: customerId,
      phone: customer.phone,
      service_id: serviceId,
      amount: service.price,
    })

    // Send confirmation to customer
    await sendBookingConfirmation(customer, booking, service, language)

    // Notify admin with contact details
    await notifyAdminNewBooking(customer, booking, service, language)

    console.log('🎉 Payment flow completed successfully!')
  } catch (error: any) {
    console.error('Error handling checkout completed:', error)
    throw error
  }
}

/**
 * Send booking confirmation to customer
 */
async function sendBookingConfirmation(customer: any, booking: any, service: any, language: string) {
  const provider = getWhatsAppProvider()
  const deliveryDate = new Date(booking.scheduled_date)
  const meetLink = booking.metadata?.meetLink

  let message = ''

  if (service.service_type === 'call' && meetLink) {
    // Call service with Meet link
    message =
      language === 'ar'
        ? `✅ تم تأكيد حجز المكالمة!\n\n` +
          `🔮 الخدمة: ${service.name_arabic}\n` +
          `💰 المبلغ: $${service.price}\n` +
          `📅 الموعد: ${deliveryDate.toLocaleDateString('ar-EG')} ${deliveryDate.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })}\n` +
          `📲 رقم الحجز: ${booking.id.substring(0, 8)}\n\n` +
          `🔗 رابط المكالمة (Google Meet):\n${meetLink}\n\n` +
          `سيتم إرسال تذكير قبل الموعد بساعة.\n\n` +
          `شكراً لثقتك بنا! 🙏✨`
        : `✅ Call Booking Confirmed!\n\n` +
          `🔮 Service: ${service.name_english}\n` +
          `💰 Amount: $${service.price}\n` +
          `📅 Time: ${deliveryDate.toLocaleDateString('en-US')} ${deliveryDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}\n` +
          `📲 Booking ID: ${booking.id.substring(0, 8)}\n\n` +
          `🔗 Meeting Link (Google Meet):\n${meetLink}\n\n` +
          `You'll receive a reminder 1 hour before the call.\n\n` +
          `Thank you for your trust! 🙏✨`
  } else {
    // Reading service
    message =
      language === 'ar'
        ? `✅ تم تأكيد حجزك!\n\n` +
          `🔮 الخدمة: ${service.name_arabic}\n` +
          `💰 المبلغ: $${service.price}\n` +
          `📅 التسليم: ${deliveryDate.toLocaleDateString('ar-EG')} في الساعة 10:00 مساءً\n` +
          `📲 رقم الحجز: ${booking.id.substring(0, 8)}\n\n` +
          `سيتم إرسال قراءتك عبر واتساب في الموعد المحدد.\n\n` +
          `شكراً لثقتك بنا! 🙏✨`
        : `✅ Booking Confirmed!\n\n` +
          `🔮 Service: ${service.name_english}\n` +
          `💰 Amount: $${service.price}\n` +
          `📅 Delivery: ${deliveryDate.toLocaleDateString('en-US')} at 10:00 PM\n` +
          `📲 Booking ID: ${booking.id.substring(0, 8)}\n\n` +
          `Your reading will be sent via WhatsApp at the scheduled time.\n\n` +
          `Thank you for your trust! 🙏✨`
  }

  await provider.sendMessage({
    to: customer.phone,
    body: message,
  })

  console.log(`✅ Confirmation sent to ${customer.phone}`)
}

/**
 * Notify admin of new booking with contact details
 */
async function notifyAdminNewBooking(customer: any, booking: any, service: any, language: string) {
  const provider = getWhatsAppProvider()
  const adminPhone = process.env.ADMIN_PHONE_NUMBER || '+9613620860'

  // Parse customer name
  const { firstName, lastName } = ContactsHelpers.parseFullName(
    customer.name_english || customer.name_arabic || 'Customer'
  )

  // Prepare contact data
  const contactData = {
    firstName,
    lastName,
    nickname: customer.name_arabic,
    phone: customer.phone,
    email: customer.email,
    notes: `Booking: ${booking.id.substring(0, 8)} | Service: ${service.name_english} | $${service.price}`,
  }

  // Format contact message
  const contactMessage = ContactsHelpers.formatContactMessage(
    contactData,
    booking,
    service,
    language as 'ar' | 'en'
  )

  // Send contact details to admin
  await provider.sendMessage({
    to: adminPhone,
    body: contactMessage,
  })

  // Generate and send vCard
  const vCard = ContactsHelpers.generateVCard(contactData)

  // Note: WhatsApp API doesn't support vCard directly via API
  // The formatted message above includes all contact info
  // Admin can manually save to contacts from the message

  // Save notification to database
  await supabaseHelpers.notifyAdmin(
    'new_booking',
    'New Booking with Contact',
    contactMessage,
    {
      priority: 'medium',
      relatedBookingId: booking.id,
      relatedCustomerId: customer.id,
      metadata: {
        service_id: service.id,
        amount: service.price,
        customer_phone: customer.phone,
        customer_email: customer.email,
      },
    }
  )

  console.log(`✅ Admin notified with contact details`)
}

/**
 * Handle payment failure
 */
async function handlePaymentFailed(paymentIntent: any) {
  console.log(`❌ Payment failed: ${paymentIntent.id}`)

  // You could notify customer or admin here
  // For now, just log it
}
