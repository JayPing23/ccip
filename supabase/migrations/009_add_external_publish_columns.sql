-- Phase 5: External distribution schema updates
-- Additive migration – enhance content_external_targets for distribution service

-- Add content_type column to distinguish announcement vs article targets
ALTER TABLE content_external_targets
  ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'ANNOUNCEMENT'
    CHECK (content_type IN ('ANNOUNCEMENT', 'ARTICLE'));

-- Add max_retries column for configurable retry limits
ALTER TABLE content_external_targets
  ADD COLUMN IF NOT EXISTS max_retries INTEGER NOT NULL DEFAULT 3;

-- Index for retry processing queries
CREATE INDEX IF NOT EXISTS idx_external_targets_retry
  ON content_external_targets (status, next_retry_at)
  WHERE status = 'PENDING' AND retry_count > 0;

-- Index for content lookup
CREATE INDEX IF NOT EXISTS idx_external_targets_content
  ON content_external_targets (content_id, content_type);
