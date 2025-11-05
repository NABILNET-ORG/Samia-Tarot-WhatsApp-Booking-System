/**
 * 🔄 Update Conversations Table
 * Add fields for AI/Human mode and employee assignment
 */

const { Client } = require('pg')

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.lovvgshqnqqlzbiviate:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'

async function main() {
  console.log('🔄 Updating conversations table...\n')

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('✅ Connected to database\n')

    // Add mode field (ai, human, hybrid)
    await client.query(`
      ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'ai' CHECK (mode IN ('ai', 'human', 'hybrid'));
    `)
    console.log('✅ Added mode column')

    // Add assignment fields
    await client.query(`
      ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS assigned_employee_id UUID REFERENCES employees(id),
      ADD COLUMN IF NOT EXISTS assigned_employee_name TEXT,
      ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP;
    `)
    console.log('✅ Added assignment columns')

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_assigned ON conversations(assigned_employee_id) WHERE assigned_employee_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_conversations_mode ON conversations(mode);
    `)
    console.log('✅ Created indexes')

    console.log('\n✅ Conversations table updated successfully!')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main().catch(console.error)
