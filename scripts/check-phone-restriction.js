const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.lovvgshqnqqlzbiviate:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkPhoneRestriction() {
  try {
    await client.connect();
    console.log('🔍 Checking Phone Number Restriction Issue\n');

    // Check all customers
    const customers = await client.query(`
      SELECT phone, name_english, created_at
      FROM customers
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log('📱 Recent Customers in Database:');
    console.log('='.repeat(70));
    if (customers.rows.length === 0) {
      console.log('  No customers found');
    } else {
      customers.rows.forEach(c => {
        console.log(`  ${c.phone} - ${c.name_english || 'No name'} - ${new Date(c.created_at).toLocaleString()}`);
      });
    }

    // Check conversations
    const convos = await client.query(`
      SELECT phone, current_state, language,
             jsonb_array_length(message_history) as msg_count,
             last_message_at
      FROM conversations
      WHERE is_active = true
      ORDER BY last_message_at DESC
      LIMIT 10
    `);

    console.log('\n💬 Active Conversations:');
    console.log('='.repeat(70));
    if (convos.rows.length === 0) {
      console.log('  No active conversations');
    } else {
      convos.rows.forEach(c => {
        console.log(`  ${c.phone} - State: ${c.current_state} - Messages: ${c.msg_count || 0} - Lang: ${c.language}`);
      });
    }

    // Check webhook logs
    const webhooks = await client.query(`
      SELECT
        created_at,
        event_type,
        processed,
        error
      FROM webhook_logs
      WHERE provider = 'meta'
      ORDER BY created_at DESC
      LIMIT 20
    `);

    console.log('\n📨 Recent Meta Webhook Logs:');
    console.log('='.repeat(70));
    webhooks.rows.forEach(w => {
      const status = w.processed ? '✅' : '❌';
      const errorMsg = w.error ? ` - Error: ${w.error.substring(0, 50)}` : '';
      console.log(`  ${status} ${w.event_type} - ${new Date(w.created_at).toLocaleTimeString()}${errorMsg}`);
    });

    // Check if there's phone filtering
    console.log('\n🔍 Checking for Phone Restrictions:');
    console.log('='.repeat(70));

    const uniquePhones = await client.query(`
      SELECT DISTINCT phone FROM customers ORDER BY phone
    `);

    console.log(`Total unique phone numbers: ${uniquePhones.rows.length}`);
    uniquePhones.rows.forEach(p => {
      const isAdmin = p.phone.includes('9613620860');
      console.log(`  ${p.phone} ${isAdmin ? '👑 (Admin)' : ''}`);
    });

    if (uniquePhones.rows.length === 1 && uniquePhones.rows[0].phone.includes('9613620860')) {
      console.log('\n⚠️  ISSUE FOUND: Only admin number in database!');
      console.log('   This means other numbers are not being processed.');
      console.log('   Possible causes:');
      console.log('   1. Meta test number restriction');
      console.log('   2. Phone numbers not added to Meta test recipients');
      console.log('   3. Webhook filtering (unlikely - no code restrictions found)');
    } else {
      console.log('\n✅ Multiple phone numbers found - no restriction in code!');
    }

    await client.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPhoneRestriction();
