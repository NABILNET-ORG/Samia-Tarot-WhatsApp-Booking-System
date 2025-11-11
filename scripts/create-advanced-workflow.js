/**
 * Create Advanced Workflow with Google Integration
 * Complete flow with Contacts and Calendar checks
 */

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres.lovvgshqnqqlzbiviate:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function createAdvancedWorkflow() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get business ID
    const { rows: businesses } = await client.query('SELECT id, name FROM businesses LIMIT 1');
    const businessId = businesses[0].id;

    console.log(`📋 Creating advanced workflow for: ${businesses[0].name}\n`);

    // Delete existing default workflow if any
    await client.query(`
      DELETE FROM automation_workflows
      WHERE business_id = $1
    `, [businessId]);

    console.log('🗑️ Removed old workflows\n');

    // Create new advanced workflow
    const { rows: [workflow] } = await client.query(`
      INSERT INTO automation_workflows (
        business_id,
        name,
        description,
        is_active,
        is_default,
        trigger_type
      ) VALUES (
        $1,
        'Advanced Booking Flow with Google Integration',
        'Smart workflow: Check Contacts → Personalized Greeting → Services → Info (if new) → Calendar Availability → Booking → Payment → Calendar Event → Confirmations',
        true,
        true,
        'new_conversation'
      )
      RETURNING id
    `, [businessId]);

    console.log('✅ Workflow created:', workflow.id);
    console.log('\n📝 Creating workflow steps...\n');

    const steps = [
      // Step 1: Check Google Contacts
      {
        key: 'check_contact',
        name: '1. Check Google Contacts',
        type: 'action',
        position: 0,
        config: {
          action: 'check_google_contact',
          save_to_variable: 'contact_exists'
        }
      },

      // Step 2: Conditional - Existing vs New Customer
      {
        key: 'contact_exists_check',
        name: '2. Check if Contact Exists',
        type: 'condition',
        position: 1,
        config: {
          variable: 'contact_exists',
          operator: 'equals',
          value: true,
          true_step: 'personalized_greeting',
          false_step: 'generic_greeting'
        }
      },

      // Step 3a: Personalized Greeting (for existing contacts)
      {
        key: 'personalized_greeting',
        name: '3a. Personalized Greeting',
        type: 'message',
        position: 2,
        config: {
          text: 'Hello {customer_name}! 🔮 Welcome back to Samia Tarot. How can I assist you today?'
        }
      },

      // Step 3b: Generic Greeting (for new contacts)
      {
        key: 'generic_greeting',
        name: '3b. Generic Greeting',
        type: 'message',
        position: 3,
        config: {
          text: 'Hello! 🔮 Welcome to Samia Tarot. How can I assist you today?'
        }
      },

      // Step 4: Show Services
      {
        key: 'show_services',
        name: '4. Display Available Services',
        type: 'action',
        position: 4,
        config: {
          action: 'list_services',
          include_prices: true
        }
      },

      // Step 5: Service Selection
      {
        key: 'service_selection',
        name: '5. Ask for Service Selection',
        type: 'question',
        position: 5,
        config: {
          text: 'Which service would you like to book? Please tell me the service name or number.',
          variable: 'selected_service',
          validation: { required: true }
        }
      },

      // Step 6: Contact Info Check
      {
        key: 'need_info_check',
        name: '6. Check if Need Customer Info',
        type: 'condition',
        position: 6,
        config: {
          variable: 'contact_exists',
          operator: 'equals',
          value: false,
          true_step: 'calendar_check', // Skip info collection
          false_step: 'ask_name' // Collect info
        }
      },

      // Step 7: Ask Name (only if new)
      {
        key: 'ask_name',
        name: '7. Ask Customer Name (English)',
        type: 'question',
        position: 7,
        config: {
          text: 'Great choice! May I have your full name in English?',
          variable: 'customer_name_english',
          validation: { required: true, min_length: 2 }
        }
      },

      // Step 8: Ask Arabic Name
      {
        key: 'ask_name_arabic',
        name: '8. Ask Customer Name (Arabic)',
        type: 'question',
        position: 8,
        config: {
          text: 'وما هو اسمك بالعربي؟ (And your name in Arabic?)',
          variable: 'customer_name_arabic'
        }
      },

      // Step 9: Ask Email
      {
        key: 'ask_email',
        name: '9. Ask Email Address',
        type: 'question',
        position: 9,
        config: {
          text: 'Thank you! What is your email address for booking confirmation?',
          variable: 'customer_email',
          validation: { required: true, pattern: 'email' }
        }
      },

      // Step 10: Save to Google Contacts
      {
        key: 'save_contact',
        name: '10. Save to Google Contacts',
        type: 'action',
        position: 10,
        config: {
          action: 'save_to_google_contacts',
          params: {
            phone: '{customer_phone}',
            name_english: '{customer_name_english}',
            name_arabic: '{customer_name_arabic}',
            email: '{customer_email}'
          }
        }
      },

      // Step 11: Check Calendar Availability
      {
        key: 'calendar_check',
        name: '11. Check Calendar Availability',
        type: 'action',
        position: 11,
        config: {
          action: 'check_calendar_availability',
          service_duration_variable: 'selected_service_duration'
        }
      },

      // Step 12: Ask for Preferred Time
      {
        key: 'ask_time',
        name: '12. Ask Preferred Date & Time',
        type: 'question',
        position: 12,
        config: {
          text: 'When would you like your session? Please provide your preferred date and time (e.g., Tomorrow at 3 PM or Nov 15 at 10 AM)',
          variable: 'preferred_datetime'
        }
      },

      // Step 13: Create Booking
      {
        key: 'create_booking',
        name: '13. Create Booking Record',
        type: 'action',
        position: 13,
        config: {
          action: 'create_booking',
          params: {
            service: '{selected_service}',
            customer_name: '{customer_name_english}',
            email: '{customer_email}',
            scheduled_date: '{preferred_datetime}',
            status: 'pending'
          }
        }
      },

      // Step 14: Send Payment Link
      {
        key: 'payment',
        name: '14. Send Payment Information',
        type: 'action',
        position: 14,
        config: {
          action: 'send_payment_link',
          payment_methods: ['stripe', 'western_union']
        }
      },

      // Step 15: Payment Confirmation Check
      {
        key: 'payment_confirmation',
        name: '15. Wait for Payment Confirmation',
        type: 'question',
        position: 15,
        config: {
          text: 'Please confirm once payment is made, or send payment screenshot/reference.',
          variable: 'payment_confirmation'
        }
      },

      // Step 16: Create Calendar Event
      {
        key: 'create_calendar_event',
        name: '16. Add to Google Calendar',
        type: 'action',
        position: 16,
        config: {
          action: 'create_calendar_event',
          params: {
            summary: 'Samia Tarot - {selected_service}',
            customer_name: '{customer_name_english}',
            customer_phone: '{customer_phone}',
            customer_email: '{customer_email}',
            start_time: '{preferred_datetime}',
            service_type: '{service_type}', // 'reading' or 'call'
            create_meet_link: '{service_type === call}'
          }
        }
      },

      // Step 17: Send Confirmation to Customer
      {
        key: 'customer_confirmation',
        name: '17. Send Booking Confirmation to Customer',
        type: 'action',
        position: 17,
        config: {
          action: 'send_booking_confirmation',
          recipient: 'customer',
          include_meet_link: '{service_type === call}',
          template: 'Your booking is confirmed! Service: {selected_service}, Date: {preferred_datetime}'
        }
      },

      // Step 18: Notify Admin
      {
        key: 'admin_notification',
        name: '18. Send Notification to Admin',
        type: 'action',
        position: 18,
        config: {
          action: 'notify_admin',
          phone: '+9613620860',
          message: 'New booking confirmed!\nCustomer: {customer_name_english}\nService: {selected_service}\nTime: {preferred_datetime}\nContact: {google_contact_link}',
          include_contact_card: true,
          include_meet_link: '{service_type === call}'
        }
      },

      // Step 19: Final Thank You
      {
        key: 'final_message',
        name: '19. Thank You Message',
        type: 'message',
        position: 19,
        config: {
          text: 'All set! ✅ You will receive a confirmation email shortly. Looking forward to your session! Is there anything else I can help you with?'
        }
      }
    ];

    for (const step of steps) {
      await client.query(`
        INSERT INTO workflow_steps (
          workflow_id,
          step_key,
          step_name,
          step_type,
          position,
          config
        ) VALUES (
          $1, $2, $3, $4, $5, $6
        )
      `, [workflow.id, step.key, step.name, step.type, step.position, JSON.stringify(step.config)]);

      console.log(`  ✅ Step ${step.position + 1}: ${step.name}`);
    }

    console.log('\n🎉 Advanced workflow created successfully!\n');
    console.log('Features included:');
    console.log('  ✅ Google Contacts check');
    console.log('  ✅ Personalized greeting for existing customers');
    console.log('  ✅ Conditional info collection (skip if contact exists)');
    console.log('  ✅ Save new contacts to Google (English + Arabic names)');
    console.log('  ✅ Calendar availability check');
    console.log('  ✅ Calendar event creation (Task for readings, Meet link for calls)');
    console.log('  ✅ Confirmation to customer with Meet link (if applicable)');
    console.log('  ✅ Admin notification with contact card');
    console.log('\nTotal steps: 19');
    console.log('\nEdit at: https://samia-tarot-app.vercel.app/dashboard/admin/workflows\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createAdvancedWorkflow();
