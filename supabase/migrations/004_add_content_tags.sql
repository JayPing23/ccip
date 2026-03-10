-- ============================================================================
-- Add content tags support
-- ============================================================================
-- The app already validates, displays, and filters announcement tags, but some
-- existing databases were provisioned before the content.tags column existed.
-- This migration makes the schema match the runtime by adding the array column
-- and a GIN index for tag containment queries.
-- ============================================================================

ALTER TABLE content
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[];

CREATE INDEX IF NOT EXISTS idx_content_tags_gin
  ON content USING GIN (tags);
