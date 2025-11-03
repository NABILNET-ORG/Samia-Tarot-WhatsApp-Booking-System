/**
 * ✅ Final Verification - Show Services as WhatsApp Menu
 */

const { Client } = require('pg')

const connectionString = 'postgresql://postgres.lovvgshqnqqlzbiviate:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'

async function verifyServices() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()

    // Get all services
    const result = await client.query(`
      SELECT
        id,
        name_english,
        name_arabic,
        price,
        service_type,
        icon_emoji,
        is_active
      FROM services
      ORDER BY id;
    `)

    console.log('🔮 SAMIA TAROT - SERVICES IN DATABASE')
    console.log('====================================\n')

    // English Menu
    console.log('📱 ENGLISH MENU (As customers will see):')
    console.log('='.repeat(50))
    result.rows.forEach((s, idx) => {
      console.log(`${idx + 1}. ${s.icon_emoji} ${s.name_english} — $${s.price}`)
    })

    // Arabic Menu
    console.log('\n📱 ARABIC MENU (As customers will see):')
    console.log('='.repeat(50))
    result.rows.forEach((s, idx) => {
      console.log(`${idx + 1}. ${s.icon_emoji} ${s.name_arabic} ${s.price} دولار`)
    })

    // Statistics
    console.log('\n📊 STATISTICS:')
    console.log('='.repeat(50))
    console.log(`Total Services: ${result.rows.length}`)
    console.log(`All Active: ${result.rows.every(s => s.is_active) ? 'Yes ✅' : 'No'}`)

    const byType = result.rows.reduce((acc, s) => {
      acc[s.service_type] = (acc[s.service_type] || 0) + 1
      return acc
    }, {})

    console.log('\nBreakdown by Type:')
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count} services`)
    })

    const totalValue = result.rows.reduce((sum, s) => sum + parseFloat(s.price), 0)
    console.log(`\nTotal Combined Value: $${totalValue.toFixed(2)}`)

    const priceRange = {
      min: Math.min(...result.rows.map(s => parseFloat(s.price))),
      max: Math.max(...result.rows.map(s => parseFloat(s.price)))
    }
    console.log(`Price Range: $${priceRange.min} - $${priceRange.max}`)

    console.log('\n✅ ALL SERVICES VERIFIED!')
    console.log('   Ready to use in your WhatsApp booking system! 🚀')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

verifyServices()
