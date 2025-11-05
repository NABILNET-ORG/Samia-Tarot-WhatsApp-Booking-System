/**
 * 📝 Create Templates & Canned Responses Tables
 * For AI prompt customization and quick replies
 */

const { Client } = require('pg')

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.lovvgshqnqqlzbiviate:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'

async function main() {
  console.log('📝 Creating templates tables...\n')

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('✅ Connected to database\n')

    // Create prompt templates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS prompt_templates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

        name TEXT NOT NULL,
        description TEXT,
        category TEXT DEFAULT 'general',

        prompt_text TEXT NOT NULL,
        variables_json JSONB DEFAULT '[]',

        language TEXT DEFAULT 'en',
        ai_model TEXT DEFAULT 'gpt-4',
        temperature DECIMAL DEFAULT 0.7,
        max_tokens INT DEFAULT 700,

        is_active BOOLEAN DEFAULT true,
        usage_count INT DEFAULT 0,

        created_by UUID REFERENCES employees(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✅ Prompt templates table created')

    // Create canned responses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS canned_responses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        shortcut TEXT,

        language TEXT DEFAULT 'en',

        is_active BOOLEAN DEFAULT true,
        usage_count INT DEFAULT 0,

        created_by UUID REFERENCES employees(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✅ Canned responses table created')

    // Insert default canned responses for Samia Tarot
    const businessResult = await client.query(`
      SELECT id FROM businesses WHERE slug = 'samia-tarot' LIMIT 1;
    `)

    if (businessResult.rows.length > 0) {
      const businessId = businessResult.rows[0].id

      await client.query(`
        INSERT INTO canned_responses (business_id, title, content, category, shortcut) VALUES
        ($1, 'Welcome', 'Hello! Welcome to our service. How can I help you today?', 'greetings', '/welcome'),
        ($1, 'Thank You', 'Thank you for contacting us! Is there anything else I can help you with?', 'greetings', '/thanks'),
        ($1, 'Payment Received', '✅ Payment received successfully! Your booking is confirmed.', 'payments', '/payment'),
        ($1, 'Checking', 'Let me check that for you. One moment please...', 'support', '/check'),
        ($1, 'Follow Up', 'I wanted to follow up on your inquiry. Have you had a chance to review the information?', 'followup', '/followup'),
        ($1, 'Availability', 'Let me check our availability for you. What date and time works best?', 'booking', '/available')
        ON CONFLICT DO NOTHING;
      `, [businessId])

      console.log('✅ Default canned responses inserted for Samia Tarot')
    }

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_prompt_templates_business ON prompt_templates(business_id);
      CREATE INDEX IF NOT EXISTS idx_canned_responses_business ON canned_responses(business_id);
      CREATE INDEX IF NOT EXISTS idx_canned_responses_shortcut ON canned_responses(shortcut);
    `)
    console.log('✅ Indexes created')

    console.log('\n✅ Templates tables setup complete!')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main().catch(console.error)
