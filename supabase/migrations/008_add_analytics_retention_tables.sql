-- Phase 5: Analytics and retention tables
-- Additive migration – no existing tables are modified

-- ---------------------------------------------------------------------------
-- content_views: per-view tracking for announcements, articles, and threads
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_views (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('ANNOUNCEMENT', 'ARTICLE', 'THREAD')),
  content_id  UUID NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_views_content ON content_views (content_type, content_id);
CREATE INDEX idx_content_views_user    ON content_views (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_content_views_date    ON content_views (viewed_at);

ALTER TABLE content_views ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert a view (their own); only admins can read all views
CREATE POLICY content_views_insert ON content_views
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY content_views_select_admin ON content_views
  FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- analytics_daily_snapshots: materialised daily aggregate for admin dashboards
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analytics_daily_snapshots (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date           DATE NOT NULL UNIQUE,
  total_users             INTEGER NOT NULL DEFAULT 0,
  active_users            INTEGER NOT NULL DEFAULT 0,
  new_users               INTEGER NOT NULL DEFAULT 0,
  announcements_published INTEGER NOT NULL DEFAULT 0,
  articles_published      INTEGER NOT NULL DEFAULT 0,
  forum_threads_created   INTEGER NOT NULL DEFAULT 0,
  forum_replies_created   INTEGER NOT NULL DEFAULT 0,
  content_views           INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_snapshots_date ON analytics_daily_snapshots (snapshot_date);

ALTER TABLE analytics_daily_snapshots ENABLE ROW LEVEL SECURITY;

-- Only admins can read or insert snapshots
CREATE POLICY snapshots_admin_select ON analytics_daily_snapshots
  FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY snapshots_admin_insert ON analytics_daily_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- retention_policies: configurable lifecycle rules per content type
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS retention_policies (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type            TEXT NOT NULL UNIQUE CHECK (content_type IN ('ANNOUNCEMENT', 'ARTICLE', 'THREAD')),
  stale_after_days        INTEGER NOT NULL DEFAULT 90,
  auto_archive_after_days INTEGER,
  enabled                 BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE retention_policies ENABLE ROW LEVEL SECURITY;

-- Only admins can manage retention policies
CREATE POLICY retention_policies_admin_select ON retention_policies
  FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY retention_policies_admin_insert ON retention_policies
  FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY retention_policies_admin_update ON retention_policies
  FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Seed default retention policies
INSERT INTO retention_policies (content_type, stale_after_days, auto_archive_after_days, enabled)
VALUES
  ('ANNOUNCEMENT', 90, 180, true),
  ('ARTICLE', 365, NULL, true),
  ('THREAD', 180, NULL, true)
ON CONFLICT (content_type) DO NOTHING;
