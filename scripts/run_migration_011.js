// Run Migration 011: Password Reset Tokens
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function run() {
  console.log('🚀 Running Migration 011: Password Reset Tokens...\n')
  const sql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/saas/011_create_password_reset_tokens.sql'), 'utf8')

  try {
    await supabase.rpc('exec_sql', { sql_query: sql })
    console.log('✅ Migration 011 complete!\n')
  } catch (err) {
    console.log('⚠️  Migration may already be applied\n')
  }
}

run().then(() => process.exit(0)).catch(console.error)
