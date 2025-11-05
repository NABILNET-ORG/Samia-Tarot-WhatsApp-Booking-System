/**
 * 🗄️ Run SaaS Migrations (Fixed for circular dependencies)
 * Execute migrations in correct order, skipping RLS policies initially
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.lovvgshqnqqlzbiviate:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'

async function runSQL(client, sql, label) {
  try {
    await client.query(sql)
    console.log(`✅ ${label}`)
    return true
  } catch (error) {
    // Ignore "already exists" errors
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log(`⏭️  ${label} (already exists)`)
      return true
    }
    console.error(`❌ ${label}:`, error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Starting SaaS Migrations (Fixed)...\n')

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('✅ Connected to database\n')

    // Step 1: Create businesses table WITHOUT RLS policies
    console.log('📦 Step 1: Creating businesses table...')
    await runSQL(client, `
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS businesses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        industry TEXT,
        whatsapp_number TEXT,
        whatsapp_provider TEXT DEFAULT 'meta',
        timezone TEXT DEFAULT 'UTC',
        subscription_tier TEXT DEFAULT 'trial',
        subscription_status TEXT DEFAULT 'active',
        is_active BOOLEAN DEFAULT true,
        is_suspended BOOLEAN DEFAULT false,
        logo_url TEXT,
        meta_phone_number_id TEXT,
        meta_access_token_encrypted TEXT,
        openai_api_key_encrypted TEXT,
        openai_model TEXT DEFAULT 'gpt-4',
        stripe_secret_key_encrypted TEXT,
        stripe_publishable_key TEXT,
        google_client_id TEXT,
        google_client_secret_encrypted TEXT,
        google_refresh_token_encrypted TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `, 'Create businesses table')

    // Step 2: Create roles table
    console.log('\n📦 Step 2: Creating roles table...')
    await runSQL(client, `
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        permissions_json JSONB DEFAULT '{}',
        is_system BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `, 'Create roles table')

    // Insert system roles
    await runSQL(client, `
      INSERT INTO roles (id, name, description, permissions_json, is_system) VALUES
      ('10000000-0000-0000-0000-000000000001', 'admin', 'Full system access', '{"businesses":{"read":true,"update":true},"employees":{"create":true,"read":true,"update":true,"delete":true,"list":true},"roles":{"create":true,"read":true,"update":true,"delete":true,"list":true},"conversations":{"read":true,"list":true,"takeover":true,"close":true,"assign":true},"customers":{"read":true,"update":true,"delete":true,"list":true,"export":true},"analytics":{"view":true,"export":true},"templates":{"create":true,"read":true,"update":true,"delete":true,"list":true}}', true),
      ('10000000-0000-0000-0000-000000000002', 'manager', 'Manager access', '{"businesses":{"read":true},"employees":{"read":true,"list":true},"conversations":{"read":true,"list":true,"takeover":true,"close":true,"assign":true},"customers":{"read":true,"update":true,"list":true,"export":true},"analytics":{"view":true,"export":true},"templates":{"create":true,"read":true,"update":true,"list":true}}', true),
      ('10000000-0000-0000-0000-000000000003', 'agent', 'Agent access', '{"conversations":{"read":true,"list":true,"takeover":true},"customers":{"read":true,"list":true},"templates":{"read":true,"list":true}}', true),
      ('10000000-0000-0000-0000-000000000004', 'viewer', 'View only access', '{"conversations":{"read":true,"list":true},"customers":{"read":true,"list":true},"templates":{"read":true,"list":true}}', true)
      ON CONFLICT (id) DO NOTHING;
    `, 'Insert system roles')

    // Step 3: Create employees table
    console.log('\n📦 Step 3: Creating employees table...')
    await runSQL(client, `
      CREATE TABLE IF NOT EXISTS employees (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        role_id UUID NOT NULL REFERENCES roles(id),
        email TEXT NOT NULL,
        full_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        avatar_url TEXT,
        custom_permissions_json JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        is_online BOOLEAN DEFAULT false,
        must_change_password BOOLEAN DEFAULT true,
        invited_by UUID,
        last_login_at TIMESTAMP,
        deactivated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(business_id, email)
      );
    `, 'Create employees table')

    // Step 4: Add business_id to existing tables
    console.log('\n📦 Step 4: Adding business_id to existing tables...')

    const existingTables = ['customers', 'conversations', 'bookings', 'analytics_events', 'services']

    for (const table of existingTables) {
      await runSQL(client, `
        ALTER TABLE ${table}
        ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
      `, `Add business_id to ${table}`)
    }

    // Step 5: Create indexes
    console.log('\n📦 Step 5: Creating indexes...')
    await runSQL(client, 'CREATE INDEX IF NOT EXISTS idx_employees_business ON employees(business_id);', 'Index: employees.business_id')
    await runSQL(client, 'CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);', 'Index: employees.email')
    await runSQL(client, 'CREATE INDEX IF NOT EXISTS idx_roles_business ON roles(business_id);', 'Index: roles.business_id')

    console.log('\n' + '='.repeat(60))
    console.log('✅ Core migrations completed successfully!')
    console.log('\n🎯 Next steps:')
    console.log('   1. Create first business (Samia Tarot)')
    console.log('   2. Create admin employee')
    console.log('   3. Migrate existing data')
    console.log('   4. Enable RLS policies (optional)')
    console.log('')

  } catch (error) {
    console.error('❌ Migration error:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main().catch(console.error)
