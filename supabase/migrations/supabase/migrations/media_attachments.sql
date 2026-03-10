CREATE TABLE media_attachments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      UUID REFERENCES content(id) ON DELETE CASCADE,
  file_name       TEXT NOT NULL,
  file_type       TEXT NOT NULL,  -- 'image' | 'pdf' | 'document'
  file_size_bytes INT NOT NULL,
  storage_path    TEXT NOT NULL,  -- Path in Supabase Storage, e.g. 'content-images/abc123.jpg'
  url             TEXT NOT NULL,  -- Public URL
  uploaded_by     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_media_attachments_content_id ON media_attachments(content_id);
CREATE INDEX idx_media_attachments_uploaded_by ON media_attachments(uploaded_by);

-- Enable RLS
ALTER TABLE media_attachments ENABLE ROW LEVEL SECURITY;

-- Everyone can read (if they can read the content, they can see attachments)
CREATE POLICY "read_all_media" ON media_attachments FOR SELECT USING (true);

-- Only authors or SUPER_ADMIN can insert
CREATE POLICY "insert_own_media" ON media_attachments FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

-- Only authors or SUPER_ADMIN can delete
CREATE POLICY "delete_own_media" ON media_attachments FOR DELETE
  USING (uploaded_by = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE name = 'SUPER_ADMIN')
  ));
