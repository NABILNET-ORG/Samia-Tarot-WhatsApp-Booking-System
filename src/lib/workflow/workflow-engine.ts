/**
 * 🚀 Complete Workflow Engine
 * Handles entire booking flow with Supabase integration
 */

import { getWhatsAppProvider } from '@/lib/whatsapp/factory'
import { supabaseAdmin, supabaseHelpers } from '@/lib/supabase/client'
import { ServiceHelpers } from '@/lib/supabase/services'
import { AIEngine } from './ai-engine'
import { PaymentHandler } from './payment-handler'
import { CalendarHelpers, TimeSlot } from '@/lib/google/calendar'

export class WorkflowEngine {
  /**
   * Main workflow entry point
   */
  static async processMessage(phone: string, message: string): Promise<void> {
    const provider = getWhatsAppProvider()

    try {
      console.log(`\n${'='.repeat(70)}`)
      console.log(`📱 Processing message from ${phone}`)
      console.log(`💬 Message: "${message}"`)
      console.log(`${'='.repeat(70)}`)

      // STEP 1: Get or create customer
      console.log('👤 Step 1: Get/Create customer...')
      let customer = await supabaseHelpers.getOrCreateCustomer(phone)
      console.log(`   ✅ Customer: ${customer.name_english || customer.id}`)

      // STEP 1.5: Check Google Contacts if customer has no name/email
      if (!customer.name_english && !customer.email) {
        console.log('🔍 Checking Google Contacts for existing customer info...')
        try {
          const { ContactsHelpers } = await import('@/lib/google/contacts')
          const existingContact = await ContactsHelpers.findContactByPhone(phone)

          if (existingContact) {
            const name = existingContact.names?.[0]?.displayName
            const email = existingContact.emailAddresses?.[0]?.value
            const nickname = existingContact.nicknames?.[0]?.value

            if (name || email) {
              console.log(`✅ Found in Google Contacts: ${name || 'No name'}, ${email || 'No email'}`)

              // Update customer in database
              await supabaseAdmin
                .from('customers')
                .update({
                  name_english: name || customer.name_english,
                  name_arabic: nickname || customer.name_arabic,
                  email: email || customer.email,
                })
                .eq('id', customer.id)

              // Reload customer
              customer = await supabaseHelpers.getOrCreateCustomer(phone)
              console.log('✅ Customer info loaded from Google Contacts')
            }
          }
        } catch (contactError) {
          console.log('⚠️  Could not check Google Contacts:', contactError)
          // Continue without Google Contacts check
        }
      }

      // STEP 2: Load conversation (with memory!)
      console.log('💭 Step 2: Load conversation...')
      let conversation = await supabaseHelpers.getActiveConversation(phone)

      if (!conversation) {
        console.log('   Creating new conversation...')
        conversation = await supabaseHelpers.upsertConversation(phone, {
          customer_id: customer.id,
          current_state: 'GREETING',
          language: 'ar',
        })
      }

      console.log(`   ✅ Conversation loaded (State: ${conversation.current_state})`)
      console.log(`   📝 History: ${conversation.message_history?.length || 0} messages`)

      // STEP 3: Add message to history
      console.log('💾 Step 3: Save message to history...')
      await supabaseHelpers.addMessageToHistory(conversation.id, 'user', message)
      console.log('   ✅ Message saved')

      // STEP 4: Analyze with AI
      console.log('🤖 Step 4: Analyzing with AI...')
      const aiDecision = await AIEngine.analyze(message, {
        currentState: conversation.current_state,
        language: conversation.language,
        conversationHistory: conversation.message_history || [],
        customerName: customer.name_english,
        customerEmail: customer.email,
        selectedService: conversation.selected_service,
      })

      console.log(`   ✅ AI Decision:`)
      console.log(`      State: ${aiDecision.state}`)
      console.log(`      Language: ${aiDecision.language}`)
      console.log(`      Message length: ${aiDecision.message.length} chars`)

      // STEP 5: Handle specific states
      console.log(`🎯 Step 5: Handling state: ${aiDecision.state}`)
      await this.handleState(aiDecision, customer, conversation)

      // STEP 6: Update conversation
      console.log('🔄 Step 6: Updating conversation...')
      const updates: any = {
        current_state: aiDecision.state,
        language: aiDecision.language,
      }

      // Update service selection
      if (aiDecision.selectedServiceId) {
        const service = await ServiceHelpers.getServiceById(aiDecision.selectedServiceId)
        if (service) {
          updates.selected_service = service.id
          updates.service_name = service.name_english
          console.log(`   📌 Service selected: ${service.name_english}`)
        }
      }

      // Update name if detected
      if (aiDecision.detectedName) {
        await supabaseAdmin
          .from('customers')
          .update({ name_english: aiDecision.detectedName })
          .eq('id', customer.id)
        updates.full_name = aiDecision.detectedName
        console.log(`   📝 Name saved: ${aiDecision.detectedName}`)
      }

      // Update email if detected
      if (aiDecision.detectedEmail) {
        await supabaseAdmin
          .from('customers')
          .update({ email: aiDecision.detectedEmail })
          .eq('id', customer.id)
        updates.email = aiDecision.detectedEmail
        console.log(`   📧 Email saved: ${aiDecision.detectedEmail}`)
      }

      // Store selected slot if provided
      if (aiDecision.metadata?.selectedSlotNumber) {
        const slotNumber = parseInt(aiDecision.metadata.selectedSlotNumber)
        const availableSlots = conversation.context_data?.availableSlots || []
        const selectedSlot = CalendarHelpers.getSlotByNumber(availableSlots, slotNumber)

        if (selectedSlot) {
          updates.context_data = {
            ...conversation.context_data,
            selectedSlot,
          }
          console.log(`   🕐 Time slot selected: ${selectedSlot.displayText}`)
        }
      }

      await supabaseHelpers.upsertConversation(phone, updates)
      console.log('   ✅ Conversation updated')

      // STEP 7: Save AI response to history
      console.log('💾 Step 7: Save AI response...')
      await supabaseHelpers.addMessageToHistory(conversation.id, 'assistant', aiDecision.message)
      console.log('   ✅ Response saved')

      // STEP 8: Send response via WhatsApp
      console.log('📤 Step 8: Sending WhatsApp message...')
      await provider.sendMessage({
        to: phone,
        body: aiDecision.message,
      })
      console.log('   ✅ Message sent')

      // STEP 9: Track analytics
      console.log('📊 Step 9: Track analytics...')
      await this.trackAnalytics(aiDecision, customer, conversation)
      console.log('   ✅ Analytics tracked')

      console.log('\n✅ Workflow completed successfully!\n')
    } catch (error: any) {
      console.error('❌ Workflow error:', error)

      // Send error message
      try {
        await provider.sendMessage({
          to: phone,
          body:
            'عذراً، حدث خطأ. سيتم توصيلك بالدعم.\nSorry, an error occurred. You will be connected to support.',
        })
      } catch (sendError) {
        console.error('Failed to send error message:', sendError)
      }

      throw error
    }
  }

  /**
   * Handle state-specific actions
   */
  private static async handleState(
    aiDecision: any,
    customer: any,
    conversation: any
  ): Promise<void> {
    const provider = getWhatsAppProvider()

    switch (aiDecision.state) {
      case 'SHOW_SERVICES':
        // Services menu shown - track view
        await supabaseHelpers.trackEvent('service_menu_viewed', {
          customer_id: customer.id,
          phone: customer.phone,
          language: aiDecision.language,
        })
        console.log('   📋 Service menu viewed')
        break

      case 'SERVICE_SELECTED':
        // Customer selected a service
        if (aiDecision.selectedServiceId) {
          await supabaseHelpers.trackEvent('service_selected', {
            customer_id: customer.id,
            phone: customer.phone,
            service_id: aiDecision.selectedServiceId,
          })
          console.log('   ✅ Service selection tracked')
        }
        break

      case 'SELECT_TIME_SLOT':
        // Show available time slots for call services
        console.log('   📅 Fetching available time slots...')
        await this.showTimeSlots(customer, conversation, aiDecision)
        break

      case 'PAYMENT':
        // Initiate payment flow
        console.log('   💳 Initiating payment...')
        await this.initiatePayment(customer, conversation, aiDecision.language)
        break

      case 'SUPPORT_REQUEST':
        // Notify admin
        console.log('   🆘 Support request - notifying admin...')
        await supabaseHelpers.notifyAdmin(
          'support_request',
          'Customer Support Request',
          `Customer ${customer.name_english || customer.phone} needs assistance.`,
          {
            priority: 'high',
            relatedCustomerId: customer.id,
            metadata: { phone: customer.phone },
          }
        )

        // Send to admin via WhatsApp
        const adminPhone = process.env.ADMIN_PHONE_NUMBER || '+9613620860'
        await provider.sendMessage({
          to: adminPhone,
          body: `🆘 Support Request\n\n👤 ${customer.name_english || 'Customer'}\n📱 ${customer.phone}\n\nNeeds assistance.`,
        })
        console.log('   ✅ Admin notified')
        break
    }
  }

  /**
   * Show available time slots for call services
   */
  private static async showTimeSlots(
    customer: any,
    conversation: any,
    aiDecision: any
  ): Promise<void> {
    const provider = getWhatsAppProvider()

    try {
      // Get service to check duration
      const service = await ServiceHelpers.getServiceById(conversation.selected_service)
      if (!service || service.service_type !== 'call') {
        console.log('   ⚠️  Not a call service, skipping slots')
        return
      }

      // Fetch available slots
      const duration = service.duration_minutes || 30
      const slots = await CalendarHelpers.getAvailableSlots(duration)

      if (slots.length === 0) {
        // No slots available
        const message =
          aiDecision.language === 'ar'
            ? 'عذراً، لا توجد مواعيد متاحة حالياً. الرجاء التواصل مع الدعم.'
            : 'Sorry, no available time slots at the moment. Please contact support.'

        await provider.sendMessage({
          to: customer.phone,
          body: message,
        })
        return
      }

      // Store slots in conversation context_data for later retrieval
      await supabaseHelpers.upsertConversation(customer.phone, {
        context_data: { availableSlots: slots },
      })

      // Format and send slots message
      const slotsMessage = CalendarHelpers.formatSlotsForWhatsApp(slots, aiDecision.language)
      await provider.sendMessage({
        to: customer.phone,
        body: slotsMessage,
      })

      console.log(`   ✅ Sent ${slots.length} time slots`)
    } catch (error: any) {
      console.error('   ❌ Error fetching time slots:', error)

      // Send error message
      const errorMessage =
        aiDecision.language === 'ar'
          ? 'عذراً، حدث خطأ في جلب الأوقات المتاحة. الرجاء المحاولة مرة أخرى.'
          : 'Sorry, there was an error fetching available times. Please try again.'

      await provider.sendMessage({
        to: customer.phone,
        body: errorMessage,
      })
    }
  }

  /**
   * Initiate payment flow
   */
  private static async initiatePayment(
    customer: any,
    conversation: any,
    language: 'ar' | 'en'
  ): Promise<void> {
    const provider = getWhatsAppProvider()

    // Get service
    const service = await ServiceHelpers.getServiceById(conversation.selected_service)
    if (!service) {
      throw new Error('Service not found for payment')
    }

    // Check if NOCARD country (Western Union available)
    const nocardPrefixes = ['+213', '+20', '+964', '+961', '+218', '+212', '+963', '+216', '+967']
    const isNOCARD = nocardPrefixes.some((prefix) => customer.phone.startsWith(prefix))

    if (isNOCARD) {
      // Offer both options
      const message =
        language === 'ar'
          ? `💳 اختر طريقة الدفع:\n\n1️⃣ بطاقة ائتمان (Stripe)\n2️⃣ ويسترن يونيون\n\n🔮 الخدمة: ${service.name_arabic}\n💰 المبلغ: $${service.price}\n\nاكتب رقم الطريقة:`
          : `💳 Choose Payment Method:\n\n1️⃣ Credit Card (Stripe)\n2️⃣ Western Union\n\n🔮 Service: ${service.name_english}\n💰 Amount: $${service.price}\n\nType method number:`

      await provider.sendMessage({
        to: customer.phone,
        body: message,
      })
    } else {
      // Create Stripe checkout (do this FIRST, before sending message)
      console.log('   🔗 Creating Stripe checkout...')
      try {
        // Get selected slot if it's a call service
        const selectedSlot = conversation.context_data?.selectedSlot
        await PaymentHandler.createStripeCheckout(customer, service, language, selectedSlot)
        console.log('   ✅ Stripe checkout created and sent!')
      } catch (error: any) {
        console.error('   ❌ Stripe checkout failed:', error.message)

        // Send error message to customer
        const errorMessage =
          language === 'ar'
            ? `عذراً، حدث خطأ في إنشاء رابط الدفع. الرجاء المحاولة مرة أخرى أو التواصل مع الدعم.`
            : `Sorry, there was an error creating the payment link. Please try again or contact support.`

        await provider.sendMessage({
          to: customer.phone,
          body: errorMessage,
        })

        throw error
      }
    }

    // Track payment initiated
    await supabaseHelpers.trackEvent('payment_initiated', {
      customer_id: customer.id,
      phone: customer.phone,
      service_id: service.id,
      amount: service.price,
    })
  }

  /**
   * Track analytics for state changes
   */
  private static async trackAnalytics(
    aiDecision: any,
    customer: any,
    conversation: any
  ): Promise<void> {
    const eventMap: any = {
      LANGUAGE_SELECTION: 'language_prompt_shown',
      GENERAL_QUESTION: 'question_answered',
      SHOW_SERVICES: 'service_menu_shown',
      SERVICE_SELECTED: 'service_selected',
      ASK_NAME: 'name_requested',
      ASK_EMAIL: 'email_requested',
      PAYMENT: 'payment_shown',
      SUPPORT_REQUEST: 'support_requested',
    }

    const eventType = eventMap[aiDecision.state]
    if (eventType) {
      await supabaseHelpers.trackEvent(eventType, {
        customer_id: customer.id,
        phone: customer.phone,
        language: aiDecision.language,
        service_id: conversation.selected_service,
      })
    }
  }
}
