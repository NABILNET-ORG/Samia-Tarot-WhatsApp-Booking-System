/**
 * Run migrations 010 and 011
 */
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigrations() {
  console.log('🔄 Running migrations 010 and 011...')

  try {
    // Migration 010: Knowledge Base
    console.log('\n📚 Migration 010: Adding knowledge_base_urls column...')
    const { error: alter1 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS knowledge_base_urls TEXT[] DEFAULT '{}';`
    })
    if (alter1) console.log('⚠️  Column might already exist:', alter1.message)

    console.log('📚 Creating knowledge_base_content table...')
    const { error: create1 } = await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS knowledge_base_content (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        source_type TEXT NOT NULL CHECK (source_type IN ('website', 'pdf', 'text', 'file')),
        source_url TEXT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        fetched_at TIMESTAMP DEFAULT NOW(),
        last_updated TIMESTAMP DEFAULT NOW(),
        fetch_error TEXT,
        is_active BOOLEAN DEFAULT true,
        created_by_employee_id UUID REFERENCES employees(id),
        UNIQUE(business_id, source_type, source_url)
      );`
    })
    if (create1) console.log('⚠️  Table might already exist:', create1.message)

    // Migration 011: Set admin role
    console.log('\n👤 Migration 011: Setting admin@samia-tarot.com as Admin...')
    const { data, error: update1 } = await supabase
      .from('employees')
      .update({
        role_id: (await supabase.from('roles').select('id').eq('name', 'Admin').single()).data?.id
      })
      .eq('email', 'admin@samia-tarot.com')
      .select()

    if (update1) {
      console.error('❌ Failed to update admin role:', update1)
    } else {
      console.log('✅ Admin role updated:', data)
    }

    console.log('\n✅ Migrations complete!')
  } catch (error) {
    console.error('❌ Migration error:', error)
  }
}

runMigrations()
