/**
 * 💬 Create Messages Table
 * For real-time chat between agents and customers
 */

const { Client } = require('pg')

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.lovvgshqnqqlzbiviate:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'

async function main() {
  console.log('💬 Creating messages table...\n')

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('✅ Connected to database\n')

    // Create messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

        -- Sender info
        sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'agent', 'system')),
        sender_id UUID, -- Employee ID if agent, null if customer
        sender_name TEXT,

        -- Message content
        content TEXT NOT NULL,
        message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'image', 'document')),

        -- Media (for voice/image/document)
        media_url TEXT,
        media_thumbnail_url TEXT,
        media_duration_seconds DECIMAL,

        -- Voice transcription
        transcription_text TEXT,
        transcription_language TEXT,
        transcription_confidence DECIMAL,

        -- Status
        is_read BOOLEAN DEFAULT false,
        read_at TIMESTAMP,
        delivered_at TIMESTAMP,

        -- Metadata
        metadata_json JSONB DEFAULT '{}',

        -- Timestamps
        created_at TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✅ Messages table created')

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_messages_business ON messages(business_id);
      CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id) WHERE is_read = false;
    `)
    console.log('✅ Indexes created')

    // Enable realtime
    await client.query(`
      ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    `)
    console.log('✅ Realtime enabled for messages')

    console.log('\n✅ Messages table setup complete!')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main().catch(console.error)
