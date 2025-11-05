/**
 * 🏢 Create Samia Tarot Business & Admin
 * Initialize first business and admin employee account
 */

const { Client } = require('pg')
const bcrypt = require('bcryptjs')

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.lovvgshqnqqlzbiviate:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'

async function main() {
  console.log('🏢 Creating Samia Tarot Business...\n')

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('✅ Connected to database\n')

    // Step 1: Create Samia Tarot business
    console.log('📦 Step 1: Creating Samia Tarot business...')

    const businessResult = await client.query(`
      INSERT INTO businesses (
        name,
        slug,
        industry,
        whatsapp_number,
        whatsapp_provider,
        timezone,
        subscription_tier,
        subscription_status,
        is_active,
        logo_url,
        meta_phone_number_id,
        openai_model
      ) VALUES (
        'Samia Tarot',
        'samia-tarot',
        'tarot',
        '+15556320392',
        'twilio',
        'Asia/Beirut',
        'pro',
        'active',
        true,
        NULL,
        '857683307429277',
        'gpt-4'
      )
      ON CONFLICT (slug) DO UPDATE
      SET name = EXCLUDED.name
      RETURNING id, name, slug;
    `)

    const business = businessResult.rows[0]
    console.log(`✅ Business created: ${business.name} (${business.id})`)

    // Step 2: Get admin role ID
    console.log('\n📦 Step 2: Getting admin role...')
    const roleResult = await client.query(`
      SELECT id FROM roles WHERE name = 'admin' AND is_system = true LIMIT 1;
    `)

    const adminRoleId = roleResult.rows[0].id
    console.log(`✅ Admin role ID: ${adminRoleId}`)

    // Step 3: Create admin employee
    console.log('\n📦 Step 3: Creating admin employee...')

    const adminPassword = 'M@ma2009' // From .env ADMIN_PASSWORD
    const passwordHash = await bcrypt.hash(adminPassword, 10)

    const employeeResult = await client.query(`
      INSERT INTO employees (
        business_id,
        role_id,
        email,
        full_name,
        password_hash,
        is_active,
        must_change_password
      ) VALUES (
        $1,
        $2,
        'admin@samia-tarot.com',
        'Samia Admin',
        $3,
        true,
        false
      )
      ON CONFLICT (business_id, email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash
      RETURNING id, email, full_name;
    `, [business.id, adminRoleId, passwordHash])

    const employee = employeeResult.rows[0]
    console.log(`✅ Admin employee created: ${employee.full_name} (${employee.email})`)

    // Step 4: Migrate existing data to this business
    console.log('\n📦 Step 4: Migrating existing data to Samia Tarot business...')

    const tables = ['customers', 'conversations', 'bookings', 'analytics_events', 'services']
    let totalMigrated = 0

    for (const table of tables) {
      const result = await client.query(`
        UPDATE ${table}
        SET business_id = $1
        WHERE business_id IS NULL;
      `, [business.id])

      console.log(`   ✅ ${table}: ${result.rowCount} rows migrated`)
      totalMigrated += result.rowCount
    }

    console.log(`\n📊 Total rows migrated: ${totalMigrated}`)

    // Print summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ Samia Tarot business setup complete!\n')
    console.log('📋 Summary:')
    console.log(`   Business ID: ${business.id}`)
    console.log(`   Business Slug: ${business.slug}`)
    console.log(`   Admin Email: ${employee.email}`)
    console.log(`   Admin Password: ${adminPassword}`)
    console.log(`   Data Migrated: ${totalMigrated} rows\n`)

    console.log('🎯 Next steps:')
    console.log('   1. Test login at /admin/login')
    console.log('   2. Verify API endpoints work')
    console.log('   3. Test permissions and RBAC')
    console.log('')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main().catch(console.error)
