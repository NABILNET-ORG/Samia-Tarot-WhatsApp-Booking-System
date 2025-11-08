/**
 * Run Migrations 015-016: Critical Database Fixes
 */

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL

  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment')
    process.exit(1)
  }

  const pool = new Pool({ connectionString })

  try {
    console.log('🔄 Connecting to database...')
    const client = await pool.connect()

    // Migration 015
    console.log('\n📖 Running Migration 015: Fix webhook_logs columns...')
    const migration015 = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/saas/015_fix_webhook_logs_columns.sql'),
      'utf8'
    )
    await client.query(migration015)
    console.log('✅ Migration 015 completed!')

    // Migration 016
    console.log('\n📖 Running Migration 016: Add active_sessions RLS...')
    const migration016 = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/saas/016_add_active_sessions_rls.sql'),
      'utf8'
    )
    await client.query(migration016)
    console.log('✅ Migration 016 completed!')

    console.log('\n🎉 All critical database fixes applied!')
    console.log('\n✅ Fixed Issues:')
    console.log('  - Added status & source columns to webhook_logs')
    console.log('  - Created RLS policies for active_sessions')
    console.log('  - Employees can now access their own sessions')
    console.log('  - Admins can monitor all sessions')

    client.release()
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigrations()
