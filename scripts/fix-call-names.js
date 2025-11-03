/**
 * 🔧 Fix Call Service Names
 * Update Golden Tarot Call and Golden Coffee Cup Call names
 */

const { Client } = require('pg')

const connectionString = 'postgresql://postgres.lovvgshqnqqlzbiviate:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'

async function fixCallNames() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('🔧 Fixing Call Service Names\n')

    // Update Golden Coffee Cup Call
    console.log('1️⃣ Updating Golden Coffee Cup Call...')
    await client.query(`
      UPDATE services
      SET
        name_english = 'Golden 15-Minute Coffee Cup Call',
        name_arabic = 'مكالمة الفنجان الذهبية 15 دقيقة',
        description_english = '15-minute direct call for coffee cup reading',
        description_arabic = 'مكالمة مباشرة لمدة 15 دقيقة لقراءة الفنجان',
        short_desc_english = '15-min call',
        short_desc_arabic = 'مكالمة 15 دقيقة',
        duration_minutes = 15
      WHERE service_key = 'golden_coffee_call';
    `)

    const coffeeResult = await client.query(`
      SELECT name_english, name_arabic, duration_minutes
      FROM services
      WHERE service_key = 'golden_coffee_call';
    `)

    console.log('   ✅ Updated!')
    console.log(`   English: ${coffeeResult.rows[0].name_english}`)
    console.log(`   Arabic: ${coffeeResult.rows[0].name_arabic}`)
    console.log(`   Duration: ${coffeeResult.rows[0].duration_minutes} minutes\n`)

    // Update Golden Tarot Call
    console.log('2️⃣ Updating Golden Tarot Call...')
    await client.query(`
      UPDATE services
      SET
        name_english = 'Golden 30-Minute Tarot Call',
        name_arabic = 'مكالمة التاروت الذهبية 30 دقيقة',
        description_english = '30-minute direct call for tarot reading',
        description_arabic = 'مكالمة مباشرة لمدة 30 دقيقة لقراءة التاروت',
        short_desc_english = '30-min tarot call',
        short_desc_arabic = 'مكالمة تاروت 30 دقيقة',
        duration_minutes = 30
      WHERE service_key = 'golden_tarot_call';
    `)

    const tarotResult = await client.query(`
      SELECT name_english, name_arabic, duration_minutes
      FROM services
      WHERE service_key = 'golden_tarot_call';
    `)

    console.log('   ✅ Updated!')
    console.log(`   English: ${tarotResult.rows[0].name_english}`)
    console.log(`   Arabic: ${tarotResult.rows[0].name_arabic}`)
    console.log(`   Duration: ${tarotResult.rows[0].duration_minutes} minutes\n`)

    // Show all services
    console.log('📋 ALL SERVICES (UPDATED):')
    console.log('='.repeat(70))

    const allServices = await client.query(`
      SELECT
        id,
        name_english,
        name_arabic,
        price,
        duration_minutes,
        icon_emoji
      FROM services
      ORDER BY id;
    `)

    console.log('\n📱 ENGLISH:')
    allServices.rows.forEach(s => {
      let name = `${s.id}. ${s.icon_emoji} ${s.name_english} — $${s.price}`
      console.log(name)
    })

    console.log('\n📱 ARABIC:')
    allServices.rows.forEach(s => {
      let name = `${s.id}. ${s.icon_emoji} ${s.name_arabic} ${s.price} دولار`
      console.log(name)
    })

    console.log('\n✅ NAMES FIXED SUCCESSFULLY!')
    console.log('\nUpdated Services:')
    console.log('  ☕📞 Golden 15-Minute Coffee Cup Call ($120) - 15 min')
    console.log('  🃏📞 Golden 30-Minute Tarot Call ($250) - 30 min')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  } finally {
    await client.end()
  }
}

console.log('🔮 Fixing Service Names')
console.log('=======================\n')

fixCallNames()
