CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  avatar_url    TEXT,
  role_id       UUID NOT NULL REFERENCES roles(id),
  org_id        UUID REFERENCES organizations(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_users_email ON users(email);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read own profile and other users (non-sensitive data)
CREATE POLICY "read_own_user" ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "read_all_user_basics" ON users FOR SELECT
  USING (true);

-- Users can update own profile only
CREATE POLICY "update_own_user" ON users FOR UPDATE
  USING (auth.uid() = id);

-- Insert new user (managed by trigger)
CREATE POLICY "insert_new_user" ON users FOR INSERT
  WITH CHECK (true);
