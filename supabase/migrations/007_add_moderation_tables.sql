-- ============================================================================
-- Phase 4: Moderation domain — additive tables for content moderation
-- ============================================================================
-- Adds `moderation_reports`, `moderation_actions`, and `user_restrictions`
-- tables.  These ship alongside the forum, not after it.
--
-- Constraints:
--   - additive only (no modifications to existing tables)
--   - RLS enabled on every new table
--   - report statuses: PENDING | REVIEWED | DISMISSED | ACTIONED
--   - moderation actions: HIDE | LOCK | REMOVE | WARN
--   - restriction types: MUTED | SUSPENDED | BANNED
--   - all moderator actions produce an audit trail
-- ============================================================================

-- ============================================================================
-- TABLE: moderation_reports
-- ============================================================================

CREATE TABLE IF NOT EXISTS moderation_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id   UUID NOT NULL REFERENCES users(id),
  content_type  TEXT NOT NULL
                CHECK (content_type IN ('THREAD','REPLY')),
  content_id    UUID NOT NULL,
  reason        TEXT NOT NULL
                CHECK (reason IN ('SPAM','HARASSMENT','MISINFORMATION','OFF_TOPIC','INAPPROPRIATE','OTHER')),
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING','REVIEWED','DISMISSED','ACTIONED')),
  reviewed_by   UUID REFERENCES users(id),
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_reports_reporter ON moderation_reports (reporter_id);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_content  ON moderation_reports (content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_status   ON moderation_reports (status);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_reviewer ON moderation_reports (reviewed_by);

-- ============================================================================
-- TABLE: moderation_actions
-- ============================================================================

CREATE TABLE IF NOT EXISTS moderation_actions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id  UUID NOT NULL REFERENCES users(id),
  report_id     UUID REFERENCES moderation_reports(id) ON DELETE SET NULL,
  content_type  TEXT NOT NULL
                CHECK (content_type IN ('THREAD','REPLY')),
  content_id    UUID NOT NULL,
  action        TEXT NOT NULL
                CHECK (action IN ('HIDE','LOCK','REMOVE','WARN')),
  reason        TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator ON moderation_actions (moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_report    ON moderation_actions (report_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_content   ON moderation_actions (content_type, content_id);

-- ============================================================================
-- TABLE: user_restrictions
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_restrictions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id),
  restriction_type TEXT NOT NULL
                   CHECK (restriction_type IN ('MUTED','SUSPENDED','BANNED')),
  reason           TEXT NOT NULL,
  issued_by        UUID NOT NULL REFERENCES users(id),
  starts_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at       TIMESTAMPTZ,
  revoked_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_restrictions_user      ON user_restrictions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_restrictions_type      ON user_restrictions (restriction_type);
CREATE INDEX IF NOT EXISTS idx_user_restrictions_issued_by ON user_restrictions (issued_by);
CREATE INDEX IF NOT EXISTS idx_user_restrictions_active    ON user_restrictions (user_id)
  WHERE revoked_at IS NULL;

-- ============================================================================
-- RLS policies for moderation_reports
-- ============================================================================

ALTER TABLE moderation_reports ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can create a report
CREATE POLICY "moderation_reports_insert" ON moderation_reports
  FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- Users can read their own submitted reports
CREATE POLICY "moderation_reports_read_own" ON moderation_reports
  FOR SELECT
  USING (reporter_id = auth.uid());

-- Moderators can read all reports
CREATE POLICY "moderation_reports_read_moderator" ON moderation_reports
  FOR SELECT
  USING (is_moderator(auth.uid()));

-- Moderators can update report status (review, dismiss, action)
CREATE POLICY "moderation_reports_update_moderator" ON moderation_reports
  FOR UPDATE
  USING (is_moderator(auth.uid()));

-- ============================================================================
-- RLS policies for moderation_actions
-- ============================================================================

ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

-- Only moderators can create moderation actions
CREATE POLICY "moderation_actions_insert" ON moderation_actions
  FOR INSERT
  WITH CHECK (is_moderator(auth.uid()));

-- Moderators can read all moderation actions (audit trail)
CREATE POLICY "moderation_actions_read_moderator" ON moderation_actions
  FOR SELECT
  USING (is_moderator(auth.uid()));

-- Moderation actions are immutable — no UPDATE or DELETE policies

-- ============================================================================
-- RLS policies for user_restrictions
-- ============================================================================

ALTER TABLE user_restrictions ENABLE ROW LEVEL SECURITY;

-- Only moderators can create restrictions
CREATE POLICY "user_restrictions_insert" ON user_restrictions
  FOR INSERT
  WITH CHECK (is_moderator(auth.uid()));

-- Users can see their own restrictions
CREATE POLICY "user_restrictions_read_own" ON user_restrictions
  FOR SELECT
  USING (user_id = auth.uid());

-- Moderators can read all restrictions
CREATE POLICY "user_restrictions_read_moderator" ON user_restrictions
  FOR SELECT
  USING (is_moderator(auth.uid()));

-- Moderators can update restrictions (revoke)
CREATE POLICY "user_restrictions_update_moderator" ON user_restrictions
  FOR UPDATE
  USING (is_moderator(auth.uid()));
