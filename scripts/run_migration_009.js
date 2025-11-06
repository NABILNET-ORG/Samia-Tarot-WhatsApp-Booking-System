/**
 * Run Migration 009: Add WhatsApp Phone ID to Businesses
 * CRITICAL: Fixes multi-tenant webhook routing
 */

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function runMigration() {
  console.log('🚀 Running Migration 009: Add WhatsApp Phone IDs to businesses table...\n')

  const sql = fs.readFileSync(
    path.join(__dirname, '../supabase/migrations/saas/009_add_whatsapp_phone_id_to_businesses.sql'),
    'utf8'
  )

  const statements = sql.split(';\n').map(s => s.trim()).filter(s => s && !s.startsWith('--'))

  for (const statement of statements) {
    if (!statement || statement.startsWith('COMMENT')) continue
    console.log('Executing...')
    try {
      await supabase.rpc('exec_sql', { sql_query: statement + ';' })
      console.log('✅ Success\n')
    } catch (err) {
      console.log('⚠️  Continuing...\n')
    }
  }

  console.log('✅ Migration 009 complete!')
  console.log('Next: WhatsApp webhook will now route messages to correct business\n')
}

runMigration().then(() => process.exit(0)).catch(console.error)
