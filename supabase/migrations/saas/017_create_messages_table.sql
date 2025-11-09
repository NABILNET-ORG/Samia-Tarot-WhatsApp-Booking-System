-- Migration 017: Create Messages Table
-- Description: Create messages table for chat history between agents and customers
-- Date: 2025-11-09

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Sender info
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'agent', 'system')),
  sender_id UUID REFERENCES employees(id) ON DELETE SET NULL, -- Employee ID if agent, null if customer
  sender_name TEXT,

  -- Message content
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'image', 'document', 'video', 'audio', 'file')),

  -- Media (for voice/image/document)
  media_url TEXT,
  media_thumbnail_url TEXT,
  media_duration_seconds DECIMAL,
  media_type TEXT,

  -- Voice transcription
  transcription_text TEXT,
  transcription_language TEXT,
  transcription_confidence DECIMAL,

  -- Direction (inbound from customer, outbound to customer)
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

-- Create indexes (matching what migration 012 expects)
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
CREATE TRIGGER messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY messages_business_isolation ON messages
  FOR ALL
  USING (
    business_id = current_setting('app.current_business_id', true)::UUID
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO authenticated;

-- Add comment
COMMENT ON TABLE messages IS 'Chat messages between customers and agents';
