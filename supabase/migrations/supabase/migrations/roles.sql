-- Create roles table
CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default roles (DO NOT change these string values)
INSERT INTO roles (name) VALUES
  ('STUDENT'),
  ('DEPT_EDITOR'),
  ('UNIVERSITY_EDITOR'),
  ('SUPER_ADMIN');

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Everyone can read roles
CREATE POLICY "read_all_roles" ON roles FOR SELECT USING (true);
