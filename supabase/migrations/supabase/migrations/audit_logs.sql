CREATE TABLE audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name   TEXT NOT NULL,
  record_id    UUID NOT NULL,
  action       TEXT NOT NULL,  -- INSERT | UPDATE | DELETE
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  diff         JSONB,  -- { "before": {...}, "after": {...} }
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for lookups
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only SUPER_ADMIN can read audit logs
CREATE POLICY "read_audit_logs_admin_only" ON audit_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE name = 'SUPER_ADMIN')
  ));

-- Only service role (or triggers) can insert
CREATE POLICY "insert_audit_logs_service" ON audit_logs FOR INSERT
  WITH CHECK (true);
