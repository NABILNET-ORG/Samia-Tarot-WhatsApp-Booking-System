/**
 * Run Migration 008: Create ai_instructions Table
 * CRITICAL: This fixes the missing ai_instructions table
 */

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('🚀 Running Migration 008: Create ai_instructions table...\n')

  const migrationPath = path.join(__dirname, '../supabase/migrations/saas/008_create_ai_instructions_table.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  // Split SQL by statement (simple approach - split by semicolon + newline)
  const statements = sql
    .split(';\n')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'))

  console.log(`Found ${statements.length} SQL statements to execute\n`)

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';'

    // Skip comments
    if (statement.trim().startsWith('--')) continue

    console.log(`[${i + 1}/${statements.length}] Executing statement...`)

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement })

      if (error) {
        // Check if it's a "already exists" error (which is okay)
        if (error.message && (
          error.message.includes('already exists') ||
          error.message.includes('duplicate')
        )) {
          console.log(`   ⚠️  Already exists (skipping)`)
        } else {
          // Try direct execution for some statements
          const { error: directError } = await supabase.from('_raw').select('*').limit(0)
          console.error(`   ❌ Error:`, error.message)
        }
      } else {
        console.log(`   ✅ Success`)
      }
    } catch (err) {
      console.error(`   ❌ Exception:`, err.message)
    }
  }

  // Verify table was created
  console.log('\n🔍 Verifying ai_instructions table...')

  const { data: tables, error: tableError } = await supabase
    .from('ai_instructions')
    .select('count')
    .limit(0)

  if (tableError && tableError.code !== '42P01') {
    console.log('✅ Table exists!')

    // Check if Samia Tarot business has default instructions
    const { data: instructions, error: selectError } = await supabase
      .from('ai_instructions')
      .select('*')
      .limit(1)

    if (selectError) {
      console.log('⚠️  Could not verify default data:', selectError.message)
    } else if (instructions && instructions.length > 0) {
      console.log(`✅ Found ${instructions.length} AI instruction(s) in database`)
    } else {
      console.log('ℹ️  No AI instructions found (table is empty)')
    }
  } else {
    console.log('❌ Table verification failed:', tableError?.message || 'Unknown error')
  }

  console.log('\n✨ Migration 008 complete!\n')
  console.log('Next steps:')
  console.log('1. Visit /dashboard/ai-instructions in your app')
  console.log('2. Configure AI behavior settings')
  console.log('3. Test the AI Instructions page')
}

runMigration()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n❌ Migration failed:', err)
    process.exit(1)
  })
