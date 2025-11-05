-- Migration 005: Prompt Templates & Canned Responses

-- Prompt Templates (Customizable AI)
CREATE TABLE IF NOT EXISTS prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  state_name TEXT NOT NULL CHECK (state_name IN (
    'GREETING', 'GENERAL_QUESTION', 'SHOW_SERVICES', 'SERVICE_SELECTED',
    'ASK_NAME', 'ASK_EMAIL', 'SELECT_TIME_SLOT', 'PAYMENT', 'SUPPORT_REQUEST'
  )),

  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('ar', 'en', 'multi')),

  variables_json JSONB DEFAULT '{}',

  model TEXT DEFAULT 'gpt-4o',
  temperature DECIMAL DEFAULT 0.7,
  max_tokens INT DEFAULT 700,

  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  parent_template_id UUID REFERENCES prompt_templates(id),

  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMP,
  avg_response_time_ms INT,
  success_rate DECIMAL,

  tags TEXT[],
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES employees(id)
);

CREATE INDEX idx_prompt_templates_business_state ON prompt_templates(business_id, state_name, is_active) WHERE is_active = true;
CREATE INDEX idx_prompt_templates_language ON prompt_templates(business_id, language);

-- Canned Responses (Quick Replies)
CREATE TABLE IF NOT EXISTS canned_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  shortcut TEXT,
  category TEXT CHECK (category IN ('greetings', 'payments', 'support', 'follow_up', 'closing', 'custom')),

  content_english TEXT NOT NULL,
  content_arabic TEXT,

  variables TEXT[] DEFAULT '{}',

  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,

  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMP,
  last_used_by UUID REFERENCES employees(id),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES employees(id)
);

CREATE INDEX idx_canned_responses_business ON canned_responses(business_id, is_active) WHERE is_active = true;
CREATE INDEX idx_canned_responses_shortcut ON canned_responses(business_id, shortcut) WHERE shortcut IS NOT NULL;
CREATE INDEX idx_canned_responses_category ON canned_responses(business_id, category);

-- RLS
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE canned_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY prompt_templates_own_business ON prompt_templates FOR ALL
  USING (business_id = current_setting('app.current_business_id', true)::UUID);

CREATE POLICY canned_responses_own_business ON canned_responses FOR ALL
  USING (business_id = current_setting('app.current_business_id', true)::UUID);
