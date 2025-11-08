/**
 * Run Migration 014: Add Missing Encrypted Columns
 * Fixes schema mismatch for secrets API
 */

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

async function runMigration() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL

  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment')
    console.error('Please add DATABASE_URL to your .env file')
    process.exit(1)
  }

  const pool = new Pool({ connectionString })

  try {
    console.log('🔄 Connecting to database...')
    const client = await pool.connect()

    console.log('📖 Reading migration file...')
    const migrationPath = path.join(__dirname, '../supabase/migrations/saas/014_add_missing_encrypted_columns.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('⚡ Running migration 014...')
    await client.query(migrationSQL)

    console.log('✅ Migration 014 completed successfully!')
    console.log('\n📊 Added columns:')
    console.log('  - meta_access_token_encrypted')
    console.log('  - meta_app_secret_encrypted')
    console.log('  - meta_verify_token_encrypted')
    console.log('  - whatsapp_phone_number_id')
    console.log('  - twilio_account_sid_encrypted')
    console.log('  - twilio_auth_token_encrypted')
    console.log('  - twilio_phone_number')
    console.log('  - twilio_whatsapp_number')
    console.log('  - openai_api_key_encrypted')
    console.log('  - stripe_secret_key_encrypted')
    console.log('  - stripe_publishable_key')
    console.log('  - stripe_webhook_secret_encrypted')
    console.log('  - google_client_id_encrypted')
    console.log('  - google_client_secret_encrypted')
    console.log('  - google_refresh_token_encrypted')
    console.log('\n🎉 Secrets API should now work!')

    client.release()
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigration()
