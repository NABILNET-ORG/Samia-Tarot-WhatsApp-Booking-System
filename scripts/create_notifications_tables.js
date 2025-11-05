/**
 * 🔔 Create Notifications Tables
 * For in-app and push notifications
 */

const { Client } = require('pg')

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.lovvgshqnqqlzbiviate:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'

async function main() {
  console.log('🔔 Creating notifications tables...\n')

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('✅ Connected to database\n')

    // Create notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,

        type TEXT NOT NULL CHECK (type IN (
          'new_message', 'new_booking', 'payment_received',
          'conversation_assigned', 'mention', 'system'
        )),
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        icon_url TEXT,

        related_conversation_id UUID REFERENCES conversations(id),
        related_message_id UUID REFERENCES messages(id),

        is_read BOOLEAN DEFAULT false,
        read_at TIMESTAMP,

        created_at TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✅ Notifications table created')

    // Create push subscriptions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

        endpoint TEXT NOT NULL UNIQUE,
        p256dh_key TEXT NOT NULL,
        auth_key TEXT NOT NULL,

        user_agent TEXT,
        device_type TEXT,

        is_active BOOLEAN DEFAULT true,
        last_used_at TIMESTAMP DEFAULT NOW(),

        created_at TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✅ Push subscriptions table created')

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_employee ON notifications(employee_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(employee_id) WHERE is_read = false;
      CREATE INDEX IF NOT EXISTS idx_push_subscriptions_employee ON push_subscriptions(employee_id);
    `)
    console.log('✅ Indexes created')

    // Enable realtime for notifications
    await client.query(`
      ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    `)
    console.log('✅ Realtime enabled for notifications')

    console.log('\n✅ Notifications tables setup complete!')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main().catch(console.error)
