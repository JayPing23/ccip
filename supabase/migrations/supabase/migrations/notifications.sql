CREATE TABLE notifications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id     UUID REFERENCES content(id) ON DELETE CASCADE,
  type           TEXT NOT NULL,  -- IN_APP | EMAIL_IMMEDIATE | EMAIL_DAILY | EMAIL_WEEKLY
  notification_text TEXT,
  read_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read own notifications
CREATE POLICY "read_own_notifications" ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can mark own notifications as read
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Service can insert notifications
CREATE POLICY "insert_notifications" ON notifications FOR INSERT
  WITH CHECK (true);
