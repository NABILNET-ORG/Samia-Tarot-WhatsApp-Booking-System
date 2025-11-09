-- Migration 019: Automation Workflow Builder
-- Description: Allow admins to create and manage conversation automation flows
-- Date: 2025-11-09

-- ==========================================
-- TABLE: automation_workflows
-- ==========================================

CREATE TABLE IF NOT EXISTS automation_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Workflow Info
  name VARCHAR(100) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) DEFAULT 'new_conversation',

  -- Status
  is_active BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,

  -- Configuration
  config_json JSONB DEFAULT '{}',

  -- Metadata
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activated_at TIMESTAMP WITH TIME ZONE,

  -- Statistics
  times_executed INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  avg_completion_time_seconds INTEGER
);

-- Add partial unique index for active workflows
CREATE UNIQUE INDEX unique_active_workflow_per_business
  ON automation_workflows(business_id)
  WHERE is_active = true AND trigger_type = 'new_conversation';

-- ==========================================
-- TABLE: workflow_steps
-- ==========================================

CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,

  -- Step Info
  step_key VARCHAR(50) NOT NULL, -- Unique identifier within workflow
  step_name VARCHAR(100) NOT NULL,
  step_type VARCHAR(50) NOT NULL, -- 'message', 'question', 'condition', 'action', 'ai_response'

  -- Position
  position INTEGER NOT NULL,
  parent_step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,

  -- Configuration (flexible JSON structure)
  config JSONB NOT NULL DEFAULT '{}',

  -- Step-specific configs:
  -- MESSAGE: { "text": "Hello!", "template_id": "uuid" }
  -- QUESTION: { "text": "Your name?", "variable": "name", "validation": {...} }
  -- CONDITION: { "variable": "vip", "operator": "equals", "value": true, "true_step": "uuid", "false_step": "uuid" }
  -- ACTION: { "action": "create_booking", "params": {...} }
  -- AI_RESPONSE: { "prompt": "Help customer", "extract_vars": ["preference"] }

  -- Next Steps (for linear flow)
  next_step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
  next_step_on_success UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
  next_step_on_failure UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_step_key_per_workflow UNIQUE (workflow_id, step_key),
  CONSTRAINT unique_position_per_workflow UNIQUE (workflow_id, position)
);

-- ==========================================
-- TABLE: workflow_executions
-- ==========================================

CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES automation_workflows(id),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Current State
  current_step_id UUID REFERENCES workflow_steps(id),
  current_step_key VARCHAR(50),
  status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed', 'abandoned', 'paused'

  -- Variables collected during flow
  variables JSONB DEFAULT '{}',

  -- Execution History
  steps_history JSONB DEFAULT '[]', -- Array of { step_id, step_key, timestamp, result }

  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Statistics
  total_steps_executed INTEGER DEFAULT 0,
  duration_seconds INTEGER
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX idx_automation_workflows_business ON automation_workflows(business_id);
CREATE INDEX idx_automation_workflows_active ON automation_workflows(business_id, is_active) WHERE is_active = true;

CREATE INDEX idx_workflow_steps_workflow ON workflow_steps(workflow_id, position);
CREATE INDEX idx_workflow_steps_key ON workflow_steps(workflow_id, step_key);

CREATE INDEX idx_workflow_executions_conversation ON workflow_executions(conversation_id);
CREATE INDEX idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(business_id, status);

-- ==========================================
-- RLS POLICIES
-- ==========================================

ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY automation_workflows_business_isolation ON automation_workflows
  FOR ALL
  USING (business_id = current_setting('app.current_business_id', true)::UUID);

CREATE POLICY workflow_steps_via_workflow ON workflow_steps
  FOR ALL
  USING (
    workflow_id IN (
      SELECT id FROM automation_workflows
      WHERE business_id = current_setting('app.current_business_id', true)::UUID
    )
  );

CREATE POLICY workflow_executions_business_isolation ON workflow_executions
  FOR ALL
  USING (business_id = current_setting('app.current_business_id', true)::UUID);

-- ==========================================
-- TRIGGERS
-- ==========================================

CREATE TRIGGER automation_workflows_updated_at
  BEFORE UPDATE ON automation_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER workflow_steps_updated_at
  BEFORE UPDATE ON workflow_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- DEFAULT WORKFLOW TEMPLATES
-- ==========================================

-- This will be inserted via API when business is created
-- Or can be manually created by admin

COMMENT ON TABLE automation_workflows IS 'Visual workflow builder for conversation automation';
COMMENT ON TABLE workflow_steps IS 'Individual steps in automation workflows';
COMMENT ON TABLE workflow_executions IS 'Track workflow execution per conversation';
