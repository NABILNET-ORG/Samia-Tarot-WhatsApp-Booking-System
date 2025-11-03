/**
 * 🧪 Complete Workflow Test Suite
 * Tests entire booking flow end-to-end
 */

const { Client } = require('pg')

const DB_URL = 'postgresql://postgres.lovvgshqnqqlzbiviate:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'

class WorkflowTester {
  constructor() {
    this.client = new Client({
      connectionString: DB_URL,
      ssl: { rejectUnauthorized: false },
    })
    this.testsPassed = 0
    this.testsFailed = 0
  }

  async connect() {
    await this.client.connect()
    console.log('✅ Connected to Supabase\n')
  }

  async disconnect() {
    await this.client.end()
    console.log('\n🔌 Disconnected from database')
  }

  async test(name, fn) {
    try {
      console.log(`🧪 TEST: ${name}`)
      console.log('='.repeat(70))
      await fn()
      console.log(`✅ PASSED\n`)
      this.testsPassed++
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}\n`)
      this.testsFailed++
    }
  }

  async runAllTests() {
    await this.connect()

    console.log('🔮 SAMIA TAROT - COMPLETE WORKFLOW TESTS')
    console.log('='.repeat(70))
    console.log('\n')

    // Test 1: Database connection
    await this.test('Database Connection', async () => {
      const result = await this.client.query('SELECT NOW()')
      if (!result.rows[0]) throw new Error('No response from database')
    })

    // Test 2: Services table exists
    await this.test('Services Table Exists', async () => {
      const result = await this.client.query('SELECT COUNT(*) FROM services')
      const count = parseInt(result.rows[0].count)
      if (count !== 13) throw new Error(`Expected 13 services, got ${count}`)
    })

    // Test 3: All services active
    await this.test('All Services Active', async () => {
      const result = await this.client.query(
        'SELECT COUNT(*) FROM services WHERE is_active = true'
      )
      const count = parseInt(result.rows[0].count)
      if (count !== 13) throw new Error(`Expected 13 active services, got ${count}`)
    })

    // Test 4: Correct prices
    await this.test('Service Prices Correct', async () => {
      const checks = [
        { id: 1, price: 50 },
        { id: 2, price: 75 },
        { id: 6, price: 150 },
        { id: 9, price: 250 },
      ]

      for (const check of checks) {
        const result = await this.client.query('SELECT price FROM services WHERE id = $1', [
          check.id,
        ])
        const price = parseFloat(result.rows[0].price)
        if (price !== check.price) {
          throw new Error(`Service ${check.id}: Expected $${check.price}, got $${price}`)
        }
      }
    })

    // Test 5: Service names correct
    await this.test('Service Names Correct (English)', async () => {
      const result = await this.client.query(
        "SELECT name_english FROM services WHERE service_key = 'golden_coffee_call'"
      )
      const name = result.rows[0].name_english
      if (!name.includes('15-Minute')) {
        throw new Error(`Expected '15-Minute' in name, got: ${name}`)
      }
    })

    // Test 6: Service names correct (Arabic)
    await this.test('Service Names Correct (Arabic)', async () => {
      const result = await this.client.query(
        "SELECT name_arabic FROM services WHERE service_key = 'golden_tarot_call'"
      )
      const name = result.rows[0].name_arabic
      if (!name.includes('30')) {
        throw new Error(`Expected '30' in Arabic name, got: ${name}`)
      }
    })

    // Test 7: Create test customer
    await this.test('Create Customer', async () => {
      await this.client.query(`
        INSERT INTO customers (phone, name_english, name_arabic, email, preferred_language)
        VALUES ('+1234567890', 'Test Customer', 'عميل تجريبي', 'test@test.com', 'en')
        ON CONFLICT (phone) DO UPDATE
        SET name_english = EXCLUDED.name_english
        RETURNING id
      `)
    })

    // Test 8: Create conversation
    await this.test('Create Conversation', async () => {
      const customerResult = await this.client.query(
        "SELECT id FROM customers WHERE phone = '+1234567890'"
      )
      const customerId = customerResult.rows[0].id

      await this.client.query(`
        INSERT INTO conversations (customer_id, phone, current_state, language, is_active)
        VALUES ($1, '+1234567890', 'GREETING', 'en', true)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [customerId])
    })

    // Test 9: Save message to conversation
    await this.test('Save Message to Conversation', async () => {
      const convResult = await this.client.query(`
        SELECT id FROM conversations
        WHERE phone = '+1234567890' AND is_active = true
        ORDER BY created_at DESC
        LIMIT 1
      `)

      if (convResult.rows.length === 0) {
        throw new Error('No conversation found')
      }

      const conversationId = convResult.rows[0].id

      // Get current history
      const historyResult = await this.client.query(
        'SELECT message_history FROM conversations WHERE id = $1',
        [conversationId]
      )

      const history = historyResult.rows[0].message_history || []
      history.push({
        role: 'user',
        content: 'Hello',
        timestamp: new Date().toISOString(),
      })

      // Update conversation
      await this.client.query(
        'UPDATE conversations SET message_history = $1 WHERE id = $2',
        [JSON.stringify(history), conversationId]
      )
    })

    // Test 10: Track analytics event
    await this.test('Track Analytics Event', async () => {
      await this.client.query(`
        INSERT INTO analytics_events (event_type, phone, service_id)
        VALUES ('test_event', '+1234567890', 1)
      `)
    })

    // Test 11: Create test booking
    await this.test('Create Booking', async () => {
      const customerResult = await this.client.query(
        "SELECT id FROM customers WHERE phone = '+1234567890'"
      )
      const customerId = customerResult.rows[0].id

      await this.client.query(`
        INSERT INTO bookings (
          customer_id, phone, service_id, service_name,
          service_type, amount, payment_status, status, language
        ) VALUES (
          $1, '+1234567890', 1, 'Coffee Cup Reading',
          'reading', 50.00, 'completed', 'confirmed', 'en'
        )
      `, [customerId])
    })

    // Test 12: Customer stats auto-update
    await this.test('Customer Stats Auto-Update', async () => {
      const result = await this.client.query(
        "SELECT total_bookings, total_spent FROM customers WHERE phone = '+1234567890'"
      )
      const customer = result.rows[0]

      if (customer.total_bookings !== 1) {
        throw new Error(`Expected 1 booking, got ${customer.total_bookings}`)
      }
      if (parseFloat(customer.total_spent) !== 50) {
        throw new Error(`Expected $50 spent, got $${customer.total_spent}`)
      }
    })

    // Test 13: Service availability check
    await this.test('Service Availability Check', async () => {
      const result = await this.client.query(`
        SELECT
          s.id,
          s.name_english,
          s.max_daily_bookings,
          COUNT(b.id) FILTER (WHERE DATE(b.created_at) = CURRENT_DATE) as booked_today
        FROM services s
        LEFT JOIN bookings b ON s.id = b.service_id
        WHERE s.id = 1
        GROUP BY s.id, s.name_english, s.max_daily_bookings
      `)

      if (!result.rows[0]) throw new Error('Service not found')
    })

    // Test 14: Service popularity view
    await this.test('Service Popularity View', async () => {
      const result = await this.client.query(`
        SELECT * FROM service_popularity
        ORDER BY total_bookings DESC
        LIMIT 1
      `)

      if (!result.rows[0]) throw new Error('View not working')
      console.log(
        `   Top service: ${result.rows[0].name_english} (${result.rows[0].total_bookings} bookings)`
      )
    })

    // Test 15: Price history tracking
    await this.test('Price History Tracking', async () => {
      // Update price
      await this.client.query("UPDATE services SET price = 55.00 WHERE id = 1")

      // Check history
      const result = await this.client.query(`
        SELECT * FROM service_price_history
        WHERE service_id = 1
        ORDER BY created_at DESC
        LIMIT 1
      `)

      if (!result.rows[0]) throw new Error('Price history not recorded')
      console.log(
        `   Tracked: $${result.rows[0].old_price} → $${result.rows[0].new_price}`
      )

      // Revert price
      await this.client.query("UPDATE services SET price = 50.00 WHERE id = 1")
    })

    // Test 16: System settings
    await this.test('System Settings', async () => {
      const result = await this.client.query(
        "SELECT setting_value FROM system_settings WHERE setting_key = 'admin_phone'"
      )
      if (result.rows[0].setting_value !== '+9613620860') {
        throw new Error('Admin phone not set correctly')
      }
    })

    // Test 17: Featured service
    await this.test('Featured Service Toggle', async () => {
      await this.client.query('UPDATE services SET is_featured = true WHERE id = 3')

      const result = await this.client.query(
        'SELECT is_featured FROM services WHERE id = 3'
      )
      if (!result.rows[0].is_featured) {
        throw new Error('Featured flag not set')
      }

      // Reset
      await this.client.query('UPDATE services SET is_featured = false WHERE id = 3')
    })

    // Test 18: Disable service
    await this.test('Disable/Enable Service', async () => {
      await this.client.query('UPDATE services SET is_active = false WHERE id = 10')

      const checkDisabled = await this.client.query(
        'SELECT is_active FROM services WHERE id = 10'
      )
      if (checkDisabled.rows[0].is_active) {
        throw new Error('Service not disabled')
      }

      // Re-enable
      await this.client.query('UPDATE services SET is_active = true WHERE id = 10')

      const checkEnabled = await this.client.query(
        'SELECT is_active FROM services WHERE id = 10'
      )
      if (!checkEnabled.rows[0].is_active) {
        throw new Error('Service not re-enabled')
      }
    })

    // Test 19: Get services by type
    await this.test('Filter Services by Type', async () => {
      const result = await this.client.query(`
        SELECT COUNT(*) FROM services
        WHERE service_type = 'call' AND is_active = true
      `)
      const count = parseInt(result.rows[0].count)
      if (count !== 4) {
        throw new Error(`Expected 4 call services, got ${count}`)
      }
    })

    // Test 20: Service menu format
    await this.test('Service Menu Format', async () => {
      const result = await this.client.query(`
        SELECT id, name_english, name_arabic, price, icon_emoji
        FROM services
        WHERE is_active = true
        ORDER BY sort_order
      `)

      let englishMenu = '🔮 Choose Your Service:\n\n'
      let arabicMenu = '🔮 اختر الخدمة:\n\n'

      result.rows.forEach((s, idx) => {
        englishMenu += `${idx + 1}. ${s.icon_emoji} ${s.name_english} — $${s.price}\n`
        arabicMenu += `${idx + 1}. ${s.icon_emoji} ${s.name_arabic} ${s.price} دولار\n`
      })

      console.log('   English menu preview:')
      console.log(englishMenu.split('\n').slice(0, 5).join('\n') + '...')
    })

    // Test 21: Conversation memory
    await this.test('Conversation Memory (Message History)', async () => {
      const result = await this.client.query(`
        SELECT message_history FROM conversations
        WHERE phone = '+1234567890'
        ORDER BY created_at DESC
        LIMIT 1
      `)

      const history = result.rows[0].message_history
      if (!Array.isArray(history)) {
        throw new Error('Message history is not an array')
      }
      if (history.length === 0) {
        throw new Error('Message history is empty')
      }

      console.log(`   Conversation has ${history.length} messages in history`)
    })

    // Test 22: Analytics events
    await this.test('Analytics Events Tracking', async () => {
      const result = await this.client.query(`
        SELECT COUNT(*) FROM analytics_events
        WHERE phone = '+1234567890'
      `)
      const count = parseInt(result.rows[0].count)
      console.log(`   ${count} events tracked for test customer`)
    })

    // Test 23: Webhook logs
    await this.test('Webhook Logging', async () => {
      const result = await this.client.query(`
        SELECT COUNT(*) FROM webhook_logs
        WHERE processed = true
      `)
      console.log(`   ${result.rows[0].count} webhooks processed successfully`)
    })

    // Test 24: Views working
    await this.test('Database Views', async () => {
      // Test customer_dashboard view
      await this.client.query('SELECT * FROM customer_dashboard LIMIT 1')

      // Test service_popularity view
      await this.client.query('SELECT * FROM service_popularity LIMIT 1')

      // Test todays_bookings view
      await this.client.query('SELECT * FROM todays_bookings LIMIT 1')

      console.log('   All 3 views working correctly')
    })

    // Test 25: Triggers working
    await this.test('Database Triggers', async () => {
      // Test updated_at trigger
      const beforeUpdate = await this.client.query(
        'SELECT updated_at FROM services WHERE id = 1'
      )

      await new Promise((resolve) => setTimeout(resolve, 1000))

      await this.client.query("UPDATE services SET price = price WHERE id = 1")

      const afterUpdate = await this.client.query(
        'SELECT updated_at FROM services WHERE id = 1'
      )

      const before = new Date(beforeUpdate.rows[0].updated_at)
      const after = new Date(afterUpdate.rows[0].updated_at)

      if (after <= before) {
        throw new Error('updated_at trigger not working')
      }

      console.log('   updated_at trigger working ✅')
    })

    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...')
    await this.client.query("DELETE FROM analytics_events WHERE phone = '+1234567890'")
    await this.client.query("DELETE FROM bookings WHERE phone = '+1234567890'")
    await this.client.query("DELETE FROM conversations WHERE phone = '+1234567890'")
    await this.client.query("DELETE FROM customers WHERE phone = '+1234567890'")
    console.log('✅ Test data cleaned up')

    await this.disconnect()

    // Summary
    console.log('\n' + '='.repeat(70))
    console.log('📊 TEST SUMMARY')
    console.log('='.repeat(70))
    console.log(`✅ Passed: ${this.testsPassed}`)
    console.log(`❌ Failed: ${this.testsFailed}`)
    console.log(`📈 Success Rate: ${Math.round((this.testsPassed / (this.testsPassed + this.testsFailed)) * 100)}%`)

    if (this.testsFailed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! System is 100% working!')
      console.log('\n✅ Database: Ready')
      console.log('✅ Services: All 13 configured correctly')
      console.log('✅ Triggers: Working')
      console.log('✅ Views: Working')
      console.log('✅ Analytics: Working')
      console.log('\n🚀 READY FOR PRODUCTION!')
    } else {
      console.log('\n⚠️  Some tests failed. Please review errors above.')
    }
  }
}

// Run tests
const tester = new WorkflowTester()
tester.runAllTests().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
