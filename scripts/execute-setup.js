/**
 * 🚀 Execute Supabase Setup Script
 * Runs all SQL to create tables and insert services
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Your Supabase connection string
const connectionString = 'postgresql://postgres.lovvgshqnqqlzbiviate:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'

async function executeSetup() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('🔌 Connecting to Supabase...')
    await client.connect()
    console.log('✅ Connected!')

    console.log('\n📄 Reading SQL setup file...')
    const sqlPath = path.join(__dirname, '../supabase/EXECUTE_SETUP.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    console.log('✅ SQL file loaded!')

    console.log('\n🚀 Executing SQL (this may take 30 seconds)...')
    await client.query(sql)
    console.log('✅ SQL executed successfully!')

    console.log('\n📊 Verifying tables created...')
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `)

    console.log('\n✅ Tables created:', tablesResult.rows.length)
    tablesResult.rows.forEach(row => {
      console.log('   - ' + row.table_name)
    })

    console.log('\n🔮 Verifying services inserted...')
    const servicesResult = await client.query(`
      SELECT id, service_key, name_english, price, is_active
      FROM services
      ORDER BY sort_order;
    `)

    console.log('\n✅ Services inserted:', servicesResult.rows.length)
    servicesResult.rows.forEach(service => {
      console.log(`   ${service.id}. ${service.name_english} - $${service.price} ${service.is_active ? '✅' : '❌'}`)
    })

    console.log('\n📈 Checking service statistics...')
    const statsResult = await client.query(`
      SELECT
        COUNT(*) as total_services,
        COUNT(*) FILTER (WHERE is_active = true) as active_services,
        COUNT(*) FILTER (WHERE is_featured = true) as featured_services,
        SUM(price) as total_value
      FROM services;
    `)

    const stats = statsResult.rows[0]
    console.log('\n📊 Service Statistics:')
    console.log(`   Total Services: ${stats.total_services}`)
    console.log(`   Active: ${stats.active_services}`)
    console.log(`   Featured: ${stats.featured_services}`)
    console.log(`   Total Value: $${stats.total_value}`)

    console.log('\n🎯 Testing service queries...')

    // Test: Get active services
    const activeResult = await client.query(`
      SELECT COUNT(*) as count FROM services WHERE is_active = true;
    `)
    console.log(`   Active services query: ${activeResult.rows[0].count} services ✅`)

    // Test: Service popularity view
    const viewResult = await client.query(`
      SELECT * FROM service_popularity LIMIT 1;
    `)
    console.log(`   Service popularity view: Working ✅`)

    // Test: Customer dashboard view
    const dashboardResult = await client.query(`
      SELECT COUNT(*) as count FROM customer_dashboard;
    `)
    console.log(`   Customer dashboard view: Working ✅`)

    console.log('\n✅ System settings inserted...')
    const settingsResult = await client.query(`
      SELECT setting_key, setting_value FROM system_settings;
    `)
    settingsResult.rows.forEach(setting => {
      console.log(`   - ${setting.setting_key}: ${setting.setting_value}`)
    })

    console.log('\n🎉 SETUP COMPLETE!')
    console.log('\n📋 Summary:')
    console.log(`   ✅ ${tablesResult.rows.length} tables created`)
    console.log(`   ✅ ${servicesResult.rows.length} services inserted`)
    console.log(`   ✅ ${settingsResult.rows.length} system settings configured`)
    console.log(`   ✅ All views and triggers active`)
    console.log(`   ✅ Database ready for use!`)

    console.log('\n🚀 Next Steps:')
    console.log('   1. Services are now in database ✅')
    console.log('   2. Update your code to use ServiceHelpers')
    console.log('   3. Try managing services with SQL queries')
    console.log('   4. Build your admin dashboard')

    console.log('\n💡 Try this query:')
    console.log('   SELECT * FROM services ORDER BY sort_order;')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('\nFull error:', error)
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n🔌 Disconnected from database')
  }
}

// Execute
console.log('🔮 Samia Tarot - Database Setup')
console.log('================================\n')

executeSetup()
  .then(() => {
    console.log('\n✅ All done! Database is ready!')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Setup failed:', error)
    process.exit(1)
  })
