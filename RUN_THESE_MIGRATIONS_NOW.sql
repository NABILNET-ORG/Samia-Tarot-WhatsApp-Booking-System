-- ================================================================
-- CRITICAL: Run these migrations in Supabase SQL Editor NOW
-- ================================================================
-- Go to: https://supabase.com/dashboard
-- Select your project → SQL Editor → New Query
-- Copy this entire file and paste → Click RUN
-- ================================================================

-- MIGRATION 017: Create Messages Table
-- ================================================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Sender info
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'agent', 'system')),
  sender_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  sender_name TEXT,

  -- Message content
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'image', 'document', 'video', 'audio', 'file')),

  -- Media
  media_url TEXT,
  media_thumbnail_url TEXT,
  media_duration_seconds DECIMAL,
  media_type TEXT,

  -- Voice transcription
  transcription_text TEXT,
  transcription_language TEXT,
  transcription_confidence DECIMAL,

  -- Direction
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),

  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  failed BOOLEAN DEFAULT false,
  error_message TEXT,

  -- WhatsApp specific
  whatsapp_message_id TEXT,

  -- Metadata
  metadata_json JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_business ON messages(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_business_created ON messages(business_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_business_voice ON messages(business_id, created_at) WHERE media_type = 'voice';
CREATE INDEX IF NOT EXISTS idx_messages_business_direction ON messages(business_id, direction, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id) WHERE sender_type = 'agent';
CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_id ON messages(whatsapp_message_id) WHERE whatsapp_message_id IS NOT NULL;

-- Add updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'messages_updated_at'
  ) THEN
    CREATE TRIGGER messages_updated_at
      BEFORE UPDATE ON messages
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DROP POLICY IF EXISTS messages_business_isolation ON messages;
CREATE POLICY messages_business_isolation ON messages
  FOR ALL
  USING (
    business_id = current_setting('app.current_business_id', true)::UUID
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO anon;

-- Add comment
COMMENT ON TABLE messages IS 'Chat messages between customers and agents';

SELECT 'Migration 017: Messages table created/verified' AS status;

-- ================================================================
-- MIGRATION 018: Add Foreign Key Constraints
-- ================================================================

-- Add foreign key constraint for conversations.selected_service
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'conversations' AND column_name = 'selected_service'
    ) THEN
        ALTER TABLE conversations ADD COLUMN selected_service UUID;
    END IF;
END $$;

-- Add the foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'conversations_selected_service_fkey'
    ) THEN
        ALTER TABLE conversations
        ADD CONSTRAINT conversations_selected_service_fkey
        FOREIGN KEY (selected_service) REFERENCES services(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_selected_service ON conversations(selected_service) WHERE selected_service IS NOT NULL;

SELECT 'Migration 018: FK constraints added/verified' AS status;

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Verify messages table exists
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'messages')
    THEN '✅ Messages table exists'
    ELSE '❌ Messages table missing'
  END AS messages_table_status;

-- Verify FK constraint exists
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'conversations_selected_service_fkey'
    )
    THEN '✅ FK constraint exists'
    ELSE '❌ FK constraint missing'
  END AS fk_constraint_status;

-- Count messages
SELECT COUNT(*) as total_messages FROM messages;

-- ================================================================
-- ALL DONE!
-- ================================================================
-- Your database is now ready for production
-- ================================================================
