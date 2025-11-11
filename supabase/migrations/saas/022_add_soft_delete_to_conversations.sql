-- Migration 022: Add Soft Delete to Conversations
-- Adds soft delete columns to conversations table

ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES employees(id);

CREATE INDEX IF NOT EXISTS idx_conversations_deleted ON conversations(business_id, is_deleted);

COMMENT ON COLUMN conversations.is_deleted IS 'Soft delete flag';
COMMENT ON COLUMN conversations.deleted_at IS 'Timestamp when conversation was deleted';
COMMENT ON COLUMN conversations.deleted_by IS 'Employee who deleted the conversation';
