/**
 * Create Default Booking Workflow
 * This creates a workflow matching the current hardcoded conversation flow
 */

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres.lovvgshqnqqlzbiviate:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function createDefaultWorkflow() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get business ID
    const { rows: businesses } = await client.query('SELECT id, name FROM businesses LIMIT 1');
    if (businesses.length === 0) {
      console.log('❌ No business found');
      return;
    }

    const businessId = businesses[0].id;
    console.log(`📋 Creating workflow for: ${businesses[0].name}\n`);

    // Create workflow
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
        'Default Booking Flow',
        'Standard conversation flow: Greeting → Service Selection → Customer Info → Booking → Payment',
        true,
        true,
        'new_conversation'
      )
      RETURNING id
    `, [businessId]);

    console.log('✅ Workflow created:', workflow.id);

    // Create steps matching current flow
    const steps = [
      {
        key: 'greeting',
        name: 'Welcome Greeting',
        type: 'message',
        position: 0,
        config: { text: 'Hello! Welcome to Samia Tarot. How can I assist you today?' }
      },
      {
        key: 'show_services',
        name: 'Show Services',
        type: 'action',
        position: 1,
        config: { action: 'list_services' }
      },
      {
        key: 'service_selection',
        name: 'Ask for Service Selection',
        type: 'question',
        position: 2,
        config: {
          text: 'Which service would you like? Please tell me the service name or number.',
          variable: 'selected_service'
        }
      },
      {
        key: 'ask_name',
        name: 'Ask Customer Name',
        type: 'question',
        position: 3,
        config: {
          text: 'Great! Could you please provide your full name?',
          variable: 'customer_name',
          validation: { required: true, min_length: 2 }
        }
      },
      {
        key: 'ask_email',
        name: 'Ask Email Address',
        type: 'question',
        position: 4,
        config: {
          text: 'Thank you! What is your email address for booking confirmation?',
          variable: 'customer_email',
          validation: { required: true, pattern: 'email' }
        }
      },
      {
        key: 'ask_date',
        name: 'Ask Preferred Date/Time',
        type: 'question',
        position: 5,
        config: {
          text: 'When would you prefer your session? Please provide date and time.',
          variable: 'preferred_datetime'
        }
      },
      {
        key: 'create_booking',
        name: 'Create Booking',
        type: 'action',
        position: 6,
        config: {
          action: 'create_booking',
          params: {
            service: '{selected_service}',
            customer_name: '{customer_name}',
            email: '{customer_email}',
            scheduled_date: '{preferred_datetime}'
          }
        }
      },
      {
        key: 'payment_info',
        name: 'Send Payment Information',
        type: 'action',
        position: 7,
        config: { action: 'send_payment_link' }
      },
      {
        key: 'confirmation',
        name: 'Booking Confirmation',
        type: 'message',
        position: 8,
        config: {
          text: 'Perfect! Your booking has been confirmed. You will receive a confirmation email shortly. Is there anything else I can help you with?'
        }
      }
    ];

    console.log('📝 Creating workflow steps...\n');

    for (const step of steps) {
      const { rows: [created] } = await client.query(`
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
        RETURNING id
      `, [workflow.id, step.key, step.name, step.type, step.position, JSON.stringify(step.config)]);

      console.log(`  ✅ Step ${step.position + 1}: ${step.name}`);
    }

    console.log('\n🎉 Default workflow created successfully!');
    console.log('\nYou can now edit this workflow in:');
    console.log(`  https://samia-tarot-app.vercel.app/dashboard/admin/workflows\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createDefaultWorkflow();
