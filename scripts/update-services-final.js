/**
 * 🔄 Update Services with Final Specification
 * Nabil's exact services, names, and prices
 */

const { Client } = require('pg')

const connectionString = 'postgresql://postgres.lovvgshqnqqlzbiviate:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'

async function updateServices() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('🔮 Updating Services with Final Specification\n')

    // Delete all existing services
    console.log('🗑️  Clearing old services...')
    await client.query('DELETE FROM services;')
    console.log('✅ Old services cleared\n')

    // Reset sequence
    await client.query('ALTER SEQUENCE services_id_seq RESTART WITH 1;')

    // Insert Nabil's exact services
    console.log('📝 Inserting your 13 services...\n')

    const services = [
      // Coffee Cup Readings
      {
        key: 'coffee_cup_reading',
        name_ar: 'قراءة الفنجان',
        name_en: 'Coffee Cup Reading',
        desc_ar: 'قراءة تقليدية للفنجان تكشف مستقبلك',
        desc_en: 'Traditional coffee cup reading revealing your future',
        short_ar: 'قراءة أساسية',
        short_en: 'Basic reading',
        price: 50.00,
        type: 'reading',
        tier: 'standard',
        delivery_days: 2,
        icon: '☕'
      },
      {
        key: 'premium_coffee_cup',
        name_ar: 'قراءة الفنجان المميزة',
        name_en: 'Premium Coffee Cup Reading',
        desc_ar: 'قراءة مفصلة للفنجان مع تحليل شامل',
        desc_en: 'Detailed coffee cup reading with comprehensive analysis',
        short_ar: 'قراءة مفصلة',
        short_en: 'Detailed reading',
        price: 75.00,
        type: 'reading',
        tier: 'premium',
        delivery_days: 1,
        icon: '☕✨'
      },
      {
        key: 'golden_coffee_cup',
        name_ar: 'قراءة الفنجان الذهبية',
        name_en: 'Golden Coffee Cup Reading',
        desc_ar: 'أفضل قراءة فنجان مع متابعة شخصية',
        desc_en: 'Best coffee cup reading with personal follow-up',
        short_ar: 'قراءة حصرية',
        short_en: 'Exclusive reading',
        price: 100.00,
        type: 'reading',
        tier: 'golden',
        delivery_days: 0,
        icon: '☕👑'
      },
      {
        key: 'video_coffee_cup',
        name_ar: 'قراءة الفنجان المصورة',
        name_en: 'Video Coffee Cup Reading',
        desc_ar: 'قراءة الفنجان بالفيديو مع شرح مفصل',
        desc_en: 'Video coffee cup reading with detailed explanation',
        short_ar: 'قراءة بالفيديو',
        short_en: 'Video reading',
        price: 120.00,
        type: 'reading',
        tier: 'video',
        delivery_days: 1,
        icon: '☕🎥'
      },
      {
        key: 'golden_coffee_call',
        name_ar: 'مكالمة الفنجان الذهبية',
        name_en: 'Golden Coffee Cup Call',
        desc_ar: 'مكالمة مباشرة لقراءة الفنجان',
        desc_en: 'Direct call for coffee cup reading',
        short_ar: 'مكالمة مباشرة',
        short_en: 'Direct call',
        price: 120.00,
        type: 'call',
        tier: 'golden',
        duration: 30,
        delivery_days: 0,
        icon: '☕📞'
      },

      // Tarot Readings
      {
        key: 'tarot_reading',
        name_ar: 'قراءة التاروت',
        name_en: 'Tarot Reading',
        desc_ar: 'قراءة تاروت شاملة تستكشف مستقبلك',
        desc_en: 'Comprehensive tarot reading exploring your future',
        short_ar: 'قراءة تاروت أساسية',
        short_en: 'Basic tarot reading',
        price: 150.00,
        type: 'reading',
        tier: 'premium',
        delivery_days: 1,
        icon: '🃏'
      },
      {
        key: 'golden_tarot',
        name_ar: 'قراءة التاروت الذهبية',
        name_en: 'Golden Tarot Reading',
        desc_ar: 'قراءة تاروت ذهبية مع تفسير كامل',
        desc_en: 'Golden tarot reading with full interpretation',
        short_ar: 'قراءة تاروت حصرية',
        short_en: 'Exclusive tarot reading',
        price: 200.00,
        type: 'reading',
        tier: 'golden',
        delivery_days: 0,
        icon: '🃏👑'
      },
      {
        key: 'video_tarot',
        name_ar: 'قراءة التاروت المصورة',
        name_en: 'Video Tarot Reading',
        desc_ar: 'قراءة التاروت بالفيديو مع شرح مفصل',
        desc_en: 'Video tarot reading with detailed explanation',
        short_ar: 'تاروت بالفيديو',
        short_en: 'Tarot video',
        price: 250.00,
        type: 'reading',
        tier: 'video',
        delivery_days: 1,
        icon: '🃏🎥'
      },
      {
        key: 'golden_tarot_call',
        name_ar: 'مكالمة التاروت الذهبية',
        name_en: 'Golden Tarot Call',
        desc_ar: 'مكالمة مباشرة لقراءة التاروت',
        desc_en: 'Direct call for tarot reading',
        short_ar: 'مكالمة تاروت',
        short_en: 'Tarot call',
        price: 250.00,
        type: 'call',
        tier: 'golden',
        duration: 45,
        delivery_days: 0,
        icon: '🃏📞'
      },

      // Rune Readings
      {
        key: 'rune_reading',
        name_ar: 'قراءة الرموز الرونية',
        name_en: 'Rune Symbols Reading',
        desc_ar: 'قراءة الرموز الرونية للتوجيه الروحي',
        desc_en: 'Rune symbols reading for spiritual guidance',
        short_ar: 'قراءة رونية',
        short_en: 'Rune reading',
        price: 100.00,
        type: 'reading',
        tier: 'premium',
        delivery_days: 1,
        icon: '🗿'
      },
      {
        key: 'golden_rune',
        name_ar: 'قراءة الرموز الرونية الذهبية',
        name_en: 'Golden Rune Symbols Reading',
        desc_ar: 'قراءة رونية ذهبية مع استشارة روحانية',
        desc_en: 'Golden rune reading with spiritual consultation',
        short_ar: 'قراءة رونية حصرية',
        short_en: 'Exclusive rune reading',
        price: 150.00,
        type: 'reading',
        tier: 'golden',
        delivery_days: 0,
        icon: '🗿👑'
      },

      // Call Services
      {
        key: 'call_30min',
        name_ar: 'مكالمة 30 دقيقة',
        name_en: '30-Minute Call',
        desc_ar: 'مكالمة مباشرة مع سامية لمدة 30 دقيقة',
        desc_en: 'Direct call with Samia for 30 minutes',
        short_ar: 'مكالمة قصيرة',
        short_en: 'Short call',
        price: 100.00,
        type: 'call',
        tier: 'standard',
        duration: 30,
        delivery_days: 0,
        icon: '📞'
      },
      {
        key: 'golden_call_30min',
        name_ar: 'المكالمة الذهبية 30 دقيقة',
        name_en: 'Golden 30-Minute Call',
        desc_ar: 'مكالمة ذهبية مع سامية لمدة 30 دقيقة',
        desc_en: 'Golden call with Samia for 30 minutes',
        short_ar: 'مكالمة ذهبية',
        short_en: 'Golden call',
        price: 150.00,
        type: 'call',
        tier: 'golden',
        duration: 30,
        delivery_days: 0,
        icon: '📞👑'
      },
    ]

    let insertCount = 0
    for (const service of services) {
      const query = `
        INSERT INTO services (
          service_key, name_arabic, name_english,
          description_arabic, description_english,
          short_desc_arabic, short_desc_english,
          price, service_type, service_tier,
          delivery_days, duration_minutes,
          sort_order, is_active, icon_emoji
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        )
        RETURNING id, name_english, price;
      `

      const values = [
        service.key,
        service.name_ar,
        service.name_en,
        service.desc_ar,
        service.desc_en,
        service.short_ar,
        service.short_en,
        service.price,
        service.type,
        service.tier,
        service.delivery_days,
        service.duration || null,
        ++insertCount,
        true,
        service.icon
      ]

      const result = await client.query(query, values)
      const inserted = result.rows[0]
      console.log(`${inserted.id}. ${service.icon} ${inserted.name_english} - $${inserted.price} ✅`)
    }

    console.log(`\n✅ All ${insertCount} services inserted successfully!\n`)

    // Verify services
    console.log('🔍 Verifying services in database...\n')
    const verification = await client.query(`
      SELECT
        id,
        name_english,
        name_arabic,
        price,
        service_type,
        icon_emoji
      FROM services
      ORDER BY id;
    `)

    console.log('📋 Final Services List:')
    console.log('='.repeat(80))
    verification.rows.forEach(s => {
      console.log(`${s.id}. ${s.icon_emoji} ${s.name_english} (${s.name_arabic}) - $${s.price}`)
    })

    // Statistics
    console.log('\n📊 Service Statistics:')
    console.log('='.repeat(80))
    const stats = await client.query(`
      SELECT
        service_type,
        COUNT(*) as count,
        SUM(price) as total_value,
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM services
      GROUP BY service_type
      ORDER BY service_type;
    `)

    stats.rows.forEach(s => {
      console.log(`${s.service_type}: ${s.count} services, $${s.min_price}-$${s.max_price}, Total: $${s.total_value}`)
    })

    const totalStats = await client.query(`
      SELECT
        COUNT(*) as total,
        SUM(price) as total_value
      FROM services;
    `)
    console.log(`\nTotal: ${totalStats.rows[0].total} services, Combined value: $${totalStats.rows[0].total_value}`)

    console.log('\n🎉 UPDATE COMPLETE!')
    console.log('\n✅ Your exact services are now in the database!')
    console.log('   - Exact names (English & Arabic)')
    console.log('   - Exact prices')
    console.log('   - Proper service types')
    console.log('   - All active and ready!')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  } finally {
    await client.end()
  }
}

console.log('🔮 Samia Tarot - Final Service Update')
console.log('=====================================\n')

updateServices()
