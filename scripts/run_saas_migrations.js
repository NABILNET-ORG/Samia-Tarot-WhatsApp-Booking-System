/**
 * 🗄️ Run SaaS Migrations
 * Execute all 7 migration files in order using direct SQL execution
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Database connection string from .env
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.lovvgshqnqqlzbiviate:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'

// Migration files in order
const migrations = [
  '001_create_businesses_table.sql',
  '002_create_employees_roles_tables.sql',
  '003_create_notifications_push_tables.sql',
  '004_create_voice_media_tables.sql',
  '005_create_templates_prompts_tables.sql',
  '006_add_business_id_to_existing_tables.sql',
  '007_create_complete_rls_policies.sql',
]

async function runMigration(client, filename) {
  console.log(`\n📄 Running: ${filename}`)

  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', 'saas', filename)

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`)
    return false
  }

  const sql = fs.readFileSync(filePath, 'utf8')

  try {
    await client.query(sql)
    console.log(`✅ Completed: ${filename}`)
    return true
  } catch (error) {
    console.error(`❌ Error in ${filename}:`, error.message)
    console.error('   Details:', error.detail || '')
    return false
  }
}

async function main() {
  console.log('🚀 Starting SaaS Migrations...\n')
  console.log(`📁 Migrations: ${migrations.length} files\n`)
  console.log('=' .repeat(60))

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    console.log('🔌 Connecting to database...')
    await client.connect()
    console.log('✅ Connected!\n')

    let successCount = 0

    for (const migration of migrations) {
      const success = await runMigration(client, migration)
      if (success) successCount++
    }

    console.log('\n' + '='.repeat(60))
    console.log(`\n📊 Results: ${successCount}/${migrations.length} migrations completed`)

    if (successCount === migrations.length) {
      console.log('✅ All migrations ran successfully!')
      console.log('\n🎯 Next steps:')
      console.log('   1. Create first business (Samia Tarot)')
      console.log('   2. Migrate existing data')
      console.log('   3. Create admin employee')
      console.log('   4. Test authentication\n')
    } else {
      console.log('⚠️  Some migrations failed. Check errors above.')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Database connection error:', error.message)
    process.exit(1)
  } finally {
    await client.end()
    console.log('👋 Disconnected from database')
  }
}

main().catch(console.error)
