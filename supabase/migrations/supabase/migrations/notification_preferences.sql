CREATE TABLE notification_preferences (
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  email_enabled  BOOLEAN DEFAULT TRUE,
  email_digest   TEXT DEFAULT 'DAILY',  -- IMMEDIATE | DAILY | WEEKLY | NONE
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, org_id)
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read own preferences
CREATE POLICY "read_own_prefs" ON notification_preferences FOR SELECT
  USING (user_id = auth.uid());

-- Users can update own preferences
CREATE POLICY "update_own_prefs" ON notification_preferences FOR UPDATE
  USING (user_id = auth.uid());

-- Service can insert default preferences
CREATE POLICY "insert_prefs" ON notification_preferences FOR INSERT
  WITH CHECK (true);
