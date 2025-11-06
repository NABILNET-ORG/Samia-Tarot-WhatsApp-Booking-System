-- Migration 010: Add Knowledge Base URLs to Businesses
-- Allows businesses to add website URLs for AI to fetch data from

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS knowledge_base_urls TEXT[] DEFAULT '{}';

COMMENT ON COLUMN businesses.knowledge_base_urls IS 'Website URLs (up to 20) for AI to fetch business information from';

-- Create table to store knowledge base content (websites, PDFs, text, etc.)
CREATE TABLE IF NOT EXISTS knowledge_base_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('website', 'pdf', 'text', 'file')),
  source_url TEXT, -- For websites and PDFs
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  fetched_at TIMESTAMP DEFAULT NOW(),
  last_updated TIMESTAMP DEFAULT NOW(),
  fetch_error TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by_employee_id UUID REFERENCES employees(id),

  UNIQUE(business_id, source_type, source_url)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_business ON knowledge_base_content(business_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_active ON knowledge_base_content(business_id, is_active) WHERE is_active = true;

-- RLS
ALTER TABLE knowledge_base_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY knowledge_base_own_business ON knowledge_base_content
  FOR ALL
  USING (business_id = current_setting('app.current_business_id', true)::UUID);

COMMENT ON TABLE knowledge_base_content IS 'Cached website content for AI knowledge base';
