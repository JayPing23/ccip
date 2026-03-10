CREATE TABLE content (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  status        TEXT NOT NULL DEFAULT 'DRAFT',  -- DRAFT | SCHEDULED | PUBLISHED | ARCHIVED
  visibility    TEXT NOT NULL DEFAULT 'ORG_ONLY',  -- PUBLIC | ORG_ONLY | DEPT_ONLY
  author_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  published_at  TIMESTAMPTZ,
  scheduled_at  TIMESTAMPTZ,
  deleted_at    TIMESTAMPTZ
);

-- Create indexes for common queries
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_author_id ON content(author_id);
CREATE INDEX idx_content_published_at ON content(published_at);
CREATE INDEX idx_content_deleted_at ON content(deleted_at);
CREATE INDEX idx_content_slug ON content(slug);
CREATE INDEX idx_content_scheduled_at ON content(scheduled_at) WHERE status = 'SCHEDULED';

-- Enable RLS
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Students can only see PUBLISHED, non-deleted content they have visibility access to
CREATE POLICY "read_own_or_published" ON content FOR SELECT
  USING (
    (status = 'PUBLISHED' AND deleted_at IS NULL) OR
    (author_id = auth.uid())
  );

-- Only authors or SUPER_ADMIN can insert
CREATE POLICY "insert_own_content" ON content FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- Only authors or SUPER_ADMIN can update
CREATE POLICY "update_own_or_admin" ON content FOR UPDATE
  USING (author_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE name = 'SUPER_ADMIN')
  ));

-- Only authors or SUPER_ADMIN can delete (soft delete via update)
CREATE POLICY "delete_own_or_admin" ON content FOR DELETE
  USING (author_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE name = 'SUPER_ADMIN')
  ));
