/**
 * 🚀 Complete Workflow Engine
 * Handles entire booking flow with Supabase integration
 */

import { getWhatsAppProvider } from '@/lib/whatsapp/factory'
import { supabaseAdmin, supabaseHelpers } from '@/lib/supabase/client'
import { ServiceHelpers } from '@/lib/supabase/services'
import { AIEngine } from './ai-engine'

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
      const customer = await supabaseHelpers.getOrCreateCustomer(phone)
      console.log(`   ✅ Customer: ${customer.name_english || customer.id}`)

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

    // Check if MENA country
    const menaPrefixes = ['+961', '+963', '+20', '+218', '+212', '+216', '+213', '+964', '+967']
    const isMENA = menaPrefixes.some((prefix) => customer.phone.startsWith(prefix))

    if (isMENA) {
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
      // Stripe only
      const message =
        language === 'ar'
          ? `💳 الدفع ببطاقة الائتمان\n\n🔮 الخدمة: ${service.name_arabic}\n💰 المبلغ: $${service.price}\n\n🔗 رابط الدفع سيتم إرساله خلال ثوانٍ...`
          : `💳 Credit Card Payment\n\n🔮 Service: ${service.name_english}\n💰 Amount: $${service.price}\n\n🔗 Payment link will be sent in a moment...`

      await provider.sendMessage({
        to: customer.phone,
        body: message,
      })

      // Create Stripe checkout (will be implemented)
      console.log('   🔗 Creating Stripe checkout...')
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
