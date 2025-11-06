-- Migration 008: AI Instructions Table
-- CRITICAL: This table is required for /dashboard/ai-instructions page to work

CREATE TABLE IF NOT EXISTS ai_instructions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Core prompts
  system_prompt TEXT NOT NULL,
  greeting_template TEXT NOT NULL,

  -- Behavior settings
  tone VARCHAR(20) NOT NULL CHECK (tone IN ('professional', 'friendly', 'mystical', 'casual')),
  language_handling VARCHAR(20) NOT NULL CHECK (language_handling IN ('auto', 'english_only', 'arabic_only', 'multilingual')),
  response_length VARCHAR(20) NOT NULL CHECK (response_length IN ('concise', 'balanced', 'detailed')),

  -- Custom instructions
  special_instructions TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Ensure one config per business
  UNIQUE(business_id)
);

-- Indexes
CREATE INDEX idx_ai_instructions_business ON ai_instructions(business_id);

-- RLS (Row-Level Security)
ALTER TABLE ai_instructions ENABLE ROW LEVEL SECURITY;

-- Policy: Businesses can only access their own AI instructions
CREATE POLICY ai_instructions_own_business ON ai_instructions FOR ALL
  USING (business_id = current_setting('app.current_business_id', true)::UUID);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_ai_instructions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_instructions_updated_at_trigger
  BEFORE UPDATE ON ai_instructions
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_instructions_updated_at();

-- Insert default for Samia Tarot business (if exists)
INSERT INTO ai_instructions (business_id, system_prompt, greeting_template, tone, language_handling, response_length)
SELECT
  id,
  'You are Samia Tarot''s AI assistant for WhatsApp booking. You help customers book spiritual reading services.

**ABOUT SAMIA TAROT:**
- Expert in Coffee Cup Reading, Tarot, and Rune readings
- Offers both written readings (delivered via WhatsApp) and video calls
- Operating hours for calls: 12 PM - 8 PM (Beirut time)
- Bilingual: Arabic & English

**YOUR ROLE:**
1. Answer general questions about services, pricing, delivery times
2. Guide customers through booking process
3. Explain differences between service tiers
4. Provide availability information for calls
5. Maintain conversation context and remember what was discussed

**RULES:**
1. Always maintain the conversation language (Arabic or English)
2. Be warm, mystical, and professional
3. Don''t ask for information you already have
4. Stay on topic (Samia Tarot services only)
5. For call services, mention availability is 12 PM - 8 PM
6. Explain payment methods: Stripe (international) or Western Union (MENA countries)' AS system_prompt,
  'مرحباً! 👋 أهلاً بك في تاروت سامية. كيف يمكنني مساعدتك اليوم؟

Hello! 👋 Welcome to Samia Tarot. How can I help you today?' AS greeting_template,
  'mystical' AS tone,
  'auto' AS language_handling,
  'balanced' AS response_length
FROM businesses
WHERE name = 'Samia Tarot'
ON CONFLICT (business_id) DO NOTHING;

COMMENT ON TABLE ai_instructions IS 'AI behavior configuration per business - controls tone, language, and conversation style';
COMMENT ON COLUMN ai_instructions.system_prompt IS 'Full system prompt sent to AI model with every conversation';
COMMENT ON COLUMN ai_instructions.greeting_template IS 'First message sent to new customers';
COMMENT ON COLUMN ai_instructions.tone IS 'Overall personality: professional, friendly, mystical, or casual';
COMMENT ON COLUMN ai_instructions.language_handling IS 'How to handle customer language: auto-detect, English only, Arabic only, or multilingual';
COMMENT ON COLUMN ai_instructions.response_length IS 'Response verbosity: concise, balanced, or detailed';
