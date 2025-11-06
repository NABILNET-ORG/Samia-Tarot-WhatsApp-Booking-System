require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

async function run() {
  console.log('🚀 Migration 013: Audit Logs...\n')
  const sql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/saas/013_create_audit_logs.sql'), 'utf8')
  try { await supabase.rpc('exec_sql', { sql_query: sql }); console.log('✅ Complete!\n') }
  catch (err) { console.log('⚠️  May already be applied\n') }
}

run().then(() => process.exit(0)).catch(console.error)
