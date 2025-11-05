-- Migration 004: Voice Messages & Media Files

-- Voice Messages (Transcription)
CREATE TABLE IF NOT EXISTS voice_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id),

  audio_url TEXT NOT NULL,
  audio_format TEXT CHECK (audio_format IN ('ogg', 'mp3', 'wav', 'm4a')),
  audio_size_bytes INT,
  audio_duration_seconds INT,

  transcription_text TEXT,
  transcription_language TEXT,
  transcription_confidence DECIMAL CHECK (transcription_confidence BETWEEN 0 AND 1),
  transcription_status TEXT DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
  transcription_error TEXT,
  transcription_cost_usd DECIMAL DEFAULT 0,
  transcription_provider TEXT DEFAULT 'google' CHECK (transcription_provider IN ('google', 'openai', 'assemblyai')),

  transcription_response_json JSONB,

  processed_by_ai BOOLEAN DEFAULT false,
  ai_response_sent BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  transcribed_at TIMESTAMP,
  processed_at TIMESTAMP
);

CREATE INDEX idx_voice_messages_conversation ON voice_messages(conversation_id, created_at DESC);
CREATE INDEX idx_voice_messages_status ON voice_messages(transcription_status) WHERE transcription_status IN ('pending', 'processing');
CREATE INDEX idx_voice_messages_business ON voice_messages(business_id, created_at DESC);

-- Media Files (General Storage)
CREATE TABLE IF NOT EXISTS media_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'document', 'logo', 'avatar', 'attachment', 'voice')),
  mime_type TEXT NOT NULL,
  file_size_bytes INT,

  width INT,
  height INT,

  used_for TEXT CHECK (used_for IN ('business_logo', 'whatsapp_profile', 'employee_avatar', 'message_attachment', 'service_image')),
  used_by_id UUID,

  cdn_url TEXT,
  thumbnail_url TEXT,

  uploaded_by UUID REFERENCES employees(id),

  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_media_files_business ON media_files(business_id, file_type);
CREATE INDEX idx_media_files_used_for ON media_files(used_for, used_by_id);

-- RLS
ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY voice_messages_own_business ON voice_messages FOR ALL
  USING (business_id = current_setting('app.current_business_id', true)::UUID);

CREATE POLICY media_files_own_business ON media_files FOR ALL
  USING (business_id = current_setting('app.current_business_id', true)::UUID);
