/**
 * Apply Migration 022: Soft Delete for Conversations
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://postgres.lovvgshqnqqlzbiviate:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function applyMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/saas/022_add_soft_delete_to_conversations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Applying migration 022...\n');
    console.log(migrationSQL);
    console.log('\n');

    // Execute migration
    await client.query(migrationSQL);

    console.log('✅ Migration 022 applied successfully!\n');
    console.log('Conversations table now has:');
    console.log('  ✅ is_deleted column');
    console.log('  ✅ deleted_at column');
    console.log('  ✅ deleted_by column');
    console.log('\nYou can now delete conversations from the dashboard!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

applyMigration();
