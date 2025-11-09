-- Migration 018: Add Missing Foreign Key Constraints
-- Description: Add foreign key constraints that were missing
-- Date: 2025-11-09

-- Add foreign key constraint for conversations.selected_service
-- First check if the column exists and add it if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'conversations' AND column_name = 'selected_service'
    ) THEN
        ALTER TABLE conversations ADD COLUMN selected_service UUID;
    END IF;
END $$;

-- Now add the foreign key constraint if it doesn't exist
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

COMMENT ON CONSTRAINT conversations_selected_service_fkey ON conversations IS 'Ensures selected service exists';
