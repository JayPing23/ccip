CREATE TABLE content_external_targets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL,  -- facebook | instagram (Phase 5+)
  external_post_id TEXT,
  status          TEXT DEFAULT 'PENDING',  -- PENDING | POSTED | FAILED
  error_log       TEXT,
  retry_count     INT DEFAULT 0,
  next_retry_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_content_external_targets_content_id ON content_external_targets(content_id);
CREATE INDEX idx_content_external_targets_status ON content_external_targets(status);

-- Enable RLS
ALTER TABLE content_external_targets ENABLE ROW LEVEL SECURITY;

-- Only SUPER_ADMIN and UNIVERSITY_EDITOR can see external targets
CREATE POLICY "read_external_targets_admin" ON content_external_targets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid() AND r.name IN ('SUPER_ADMIN', 'UNIVERSITY_EDITOR')
  ));
