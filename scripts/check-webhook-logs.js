const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres.lovvgshqnqqlzbiviate:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function checkLogs() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check recent webhook logs
    console.log('📋 Recent webhook logs (last hour):');
    const { rows: webhooks } = await client.query(`
      SELECT
        created_at,
        provider,
        event_type,
        status,
        error,
        processed
      FROM webhook_logs
      WHERE created_at > NOW() - INTERVAL '1 hour'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    if (webhooks.length === 0) {
      console.log('⚠️  No webhook logs in the last hour');
      console.log('   This means Meta is NOT sending webhooks to your server\n');
    } else {
      webhooks.forEach(w => {
        console.log(`  - ${w.created_at} | ${w.provider} | ${w.event_type} | Status: ${w.status || 'N/A'} | Processed: ${w.processed}`);
        if (w.error) console.log(`    ERROR: ${w.error}`);
      });
    }

    console.log('\n💬 Recent conversations (last hour):');
    const { rows: convs } = await client.query(`
      SELECT
        id,
        phone,
        mode,
        current_state,
        last_message_at,
        created_at
      FROM conversations
      WHERE created_at > NOW() - INTERVAL '1 hour'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    if (convs.length === 0) {
      console.log('⚠️  No conversations in the last hour\n');
    } else {
      convs.forEach(c => {
        console.log(`  - ${c.phone} | Mode: ${c.mode} | State: ${c.current_state}`);
      });
    }

    console.log('\n💬 Recent messages (last hour):');
    const { rows: msgs } = await client.query(`
      SELECT
        created_at,
        sender_type,
        content
      FROM messages
      WHERE created_at > NOW() - INTERVAL '1 hour'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    if (msgs.length === 0) {
      console.log('⚠️  No messages in the last hour\n');
    } else {
      msgs.forEach(m => {
        console.log(`  - ${m.created_at} | ${m.sender_type}: ${m.content.substring(0, 50)}`);
      });
    }

    console.log('\n📊 Summary:');
    console.log(`  Webhooks received: ${webhooks.length}`);
    console.log(`  Conversations: ${convs.length}`);
    console.log(`  Messages: ${msgs.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkLogs();
