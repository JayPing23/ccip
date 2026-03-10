CREATE TABLE content_organizations (
  content_id   UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (content_id, org_id)
);

-- Create index for org lookups
CREATE INDEX idx_content_organizations_org_id ON content_organizations(org_id);

-- Enable RLS
ALTER TABLE content_organizations ENABLE ROW LEVEL SECURITY;

-- Everyone can read (visibility is controlled via content RLS)
CREATE POLICY "read_all_content_orgs" ON content_organizations FOR SELECT USING (true);

-- Only authors or SUPER_ADMIN can manage
CREATE POLICY "insert_content_orgs" ON content_organizations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM content WHERE id = content_id AND (
      author_id = auth.uid() OR
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE name = 'SUPER_ADMIN'))
    )
  ));
