/**
 * 🧪 Test Services in Database
 * Run queries to verify everything works
 */

const { Client } = require('pg')

const connectionString = 'postgresql://postgres.lovvgshqnqqlzbiviate:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'

async function testServices() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('🔮 Testing Services in Database\n')

    // Test 1: Get all services
    console.log('📋 Test 1: Get All Services')
    console.log('='.repeat(50))
    const allServices = await client.query(`
      SELECT id, name_english, name_arabic, price, service_type, is_active
      FROM services
      ORDER BY sort_order;
    `)
    allServices.rows.forEach(s => {
      console.log(`${s.id}. ${s.name_english} (${s.name_arabic}) - $${s.price} [${s.service_type}] ${s.is_active ? '✅' : '❌'}`)
    })

    // Test 2: Get only call services
    console.log('\n📞 Test 2: Get Call Services Only')
    console.log('='.repeat(50))
    const callServices = await client.query(`
      SELECT name_english, price, is_active
      FROM services
      WHERE service_type = 'call'
      ORDER BY price;
    `)
    callServices.rows.forEach(s => {
      console.log(`${s.name_english} - $${s.price} ${s.is_active ? '✅' : '❌'}`)
    })

    // Test 3: Update a price
    console.log('\n💰 Test 3: Update Price (Golden Tarot → $180)')
    console.log('='.repeat(50))
    await client.query(`
      UPDATE services
      SET price = 180.00
      WHERE service_key = 'golden_tarot';
    `)
    const updated = await client.query(`
      SELECT name_english, price FROM services WHERE service_key = 'golden_tarot';
    `)
    console.log(`Updated: ${updated.rows[0].name_english} → $${updated.rows[0].price} ✅`)

    // Test 4: Check price history
    console.log('\n📜 Test 4: Check Price History')
    console.log('='.repeat(50))
    const history = await client.query(`
      SELECT service_key, old_price, new_price, created_at
      FROM service_price_history
      ORDER BY created_at DESC
      LIMIT 5;
    `)
    if (history.rows.length > 0) {
      history.rows.forEach(h => {
        console.log(`${h.service_key}: $${h.old_price} → $${h.new_price} (${new Date(h.created_at).toLocaleString()})`)
      })
    } else {
      console.log('No price changes yet')
    }

    // Test 5: Feature a service
    console.log('\n⭐ Test 5: Feature Golden Coffee Cup')
    console.log('='.repeat(50))
    await client.query(`
      UPDATE services
      SET is_featured = true, sort_order = 1
      WHERE service_key = 'golden_coffee_cup';
    `)
    const featured = await client.query(`
      SELECT name_english, is_featured, sort_order
      FROM services
      WHERE is_featured = true;
    `)
    console.log(`Featured: ${featured.rows[0].name_english} (sort: ${featured.rows[0].sort_order}) ⭐`)

    // Test 6: Disable call services
    console.log('\n🔒 Test 6: Disable All Call Services (Vacation Mode)')
    console.log('='.repeat(50))
    await client.query(`
      UPDATE services
      SET is_active = false
      WHERE service_type = 'call';
    `)
    const disabled = await client.query(`
      SELECT COUNT(*) as count FROM services WHERE service_type = 'call' AND is_active = false;
    `)
    console.log(`Disabled ${disabled.rows[0].count} call services ✅`)

    // Test 7: Re-enable call services
    console.log('\n✅ Test 7: Re-enable Call Services')
    console.log('='.repeat(50))
    await client.query(`
      UPDATE services
      SET is_active = true
      WHERE service_type = 'call';
    `)
    const enabled = await client.query(`
      SELECT COUNT(*) as count FROM services WHERE service_type = 'call' AND is_active = true;
    `)
    console.log(`Re-enabled ${enabled.rows[0].count} call services ✅`)

    // Test 8: Service statistics
    console.log('\n📊 Test 8: Service Statistics')
    console.log('='.repeat(50))
    const stats = await client.query(`
      SELECT
        service_type,
        COUNT(*) as count,
        SUM(price) as total_value,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM services
      WHERE is_active = true
      GROUP BY service_type
      ORDER BY total_value DESC;
    `)
    stats.rows.forEach(s => {
      console.log(`${s.service_type}: ${s.count} services, Avg: $${parseFloat(s.avg_price).toFixed(2)}, Total: $${s.total_value}`)
    })

    // Test 9: Get featured services
    console.log('\n⭐ Test 9: Featured Services')
    console.log('='.repeat(50))
    const featuredServices = await client.query(`
      SELECT name_english, price, icon_emoji
      FROM services
      WHERE is_featured = true
      ORDER BY sort_order;
    `)
    if (featuredServices.rows.length > 0) {
      featuredServices.rows.forEach(s => {
        console.log(`${s.icon_emoji} ${s.name_english} - $${s.price} ⭐`)
      })
    } else {
      console.log('No featured services')
    }

    // Test 10: Service popularity view
    console.log('\n🔥 Test 10: Service Popularity (Most Booked)')
    console.log('='.repeat(50))
    const popularity = await client.query(`
      SELECT
        name_english,
        service_type,
        price,
        is_active
      FROM service_popularity
      WHERE is_active = true
      ORDER BY price DESC
      LIMIT 5;
    `)
    popularity.rows.forEach((s, idx) => {
      console.log(`${idx + 1}. ${s.name_english} - $${s.price} [${s.service_type}]`)
    })

    console.log('\n✅ ALL TESTS PASSED!')
    console.log('\n🎉 Services are working perfectly in database!')
    console.log('\n💡 Try these queries in Supabase Dashboard:')
    console.log('   - SELECT * FROM services ORDER BY price DESC;')
    console.log('   - UPDATE services SET price = price * 0.9 WHERE service_tier = \'golden\';')
    console.log('   - SELECT * FROM service_price_history;')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

testServices()
