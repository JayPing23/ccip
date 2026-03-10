-- ============================================================================
-- Phase 4: Forum domain — additive tables for community discussion
-- ============================================================================
-- Adds `forum_categories`, `forum_threads`, `forum_replies`, and
-- `forum_reactions` tables.  These are separate from both the official
-- `content` table (announcements) and the `articles` table (publication).
--
-- Constraints:
--   - additive only (no modifications to existing tables)
--   - RLS enabled on every new table
--   - soft delete via deleted_at on threads and replies
--   - thread statuses: OPEN | LOCKED | HIDDEN | REMOVED
--   - reply statuses: VISIBLE | HIDDEN | REMOVED
--   - no anonymous posting — all rows reference users(id)
-- ============================================================================

-- ============================================================================
-- Helper: is_moderator — editors and admins can moderate
-- ============================================================================

CREATE OR REPLACE FUNCTION is_moderator(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT get_user_role(user_id) IN ('DEPT_EDITOR', 'UNIVERSITY_EDITOR', 'SUPER_ADMIN');
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- TABLE: forum_categories
-- ============================================================================

CREATE TABLE IF NOT EXISTS forum_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_categories_slug  ON forum_categories (slug);
CREATE INDEX IF NOT EXISTS idx_forum_categories_order ON forum_categories (display_order);

-- ============================================================================
-- TABLE: forum_threads
-- ============================================================================

CREATE TABLE IF NOT EXISTS forum_threads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES forum_categories(id),
  author_id   UUID NOT NULL REFERENCES users(id),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL DEFAULT '',
  slug        TEXT NOT NULL UNIQUE,
  status      TEXT NOT NULL DEFAULT 'OPEN'
              CHECK (status IN ('OPEN','LOCKED','HIDDEN','REMOVED')),
  pinned      BOOLEAN NOT NULL DEFAULT FALSE,
  reply_count INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_forum_threads_slug       ON forum_threads (slug);
CREATE INDEX IF NOT EXISTS idx_forum_threads_category   ON forum_threads (category_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_author     ON forum_threads (author_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_status     ON forum_threads (status);
CREATE INDEX IF NOT EXISTS idx_forum_threads_deleted_at ON forum_threads (deleted_at);

-- ============================================================================
-- TABLE: forum_replies
-- ============================================================================

CREATE TABLE IF NOT EXISTS forum_replies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id       UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  author_id       UUID NOT NULL REFERENCES users(id),
  body            TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'VISIBLE'
                  CHECK (status IN ('VISIBLE','HIDDEN','REMOVED')),
  parent_reply_id UUID REFERENCES forum_replies(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_forum_replies_thread ON forum_replies (thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_author ON forum_replies (author_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_parent ON forum_replies (parent_reply_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_status ON forum_replies (status);

-- ============================================================================
-- TABLE: forum_reactions
-- ============================================================================

CREATE TABLE IF NOT EXISTS forum_reactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  thread_id     UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  reply_id      UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'LIKE'
                CHECK (reaction_type IN ('LIKE','HELPFUL','INSIGHTFUL')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reaction_target_check CHECK (
    (thread_id IS NOT NULL AND reply_id IS NULL)
    OR (thread_id IS NULL AND reply_id IS NOT NULL)
  ),
  CONSTRAINT unique_user_thread_reaction UNIQUE (user_id, thread_id, reaction_type),
  CONSTRAINT unique_user_reply_reaction  UNIQUE (user_id, reply_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_forum_reactions_user   ON forum_reactions (user_id);
CREATE INDEX IF NOT EXISTS idx_forum_reactions_thread ON forum_reactions (thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_reactions_reply  ON forum_reactions (reply_id);

-- ============================================================================
-- RLS policies for forum_categories
-- ============================================================================

ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read categories
CREATE POLICY "forum_categories_read" ON forum_categories
  FOR SELECT
  USING (true);

-- Only admins can manage categories
CREATE POLICY "forum_categories_insert" ON forum_categories
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "forum_categories_update" ON forum_categories
  FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "forum_categories_delete" ON forum_categories
  FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- RLS policies for forum_threads
-- ============================================================================

ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read open, non-deleted threads
CREATE POLICY "forum_threads_read_open" ON forum_threads
  FOR SELECT
  USING (status = 'OPEN' AND deleted_at IS NULL);

-- Moderators can see all non-deleted threads (including hidden/locked)
CREATE POLICY "forum_threads_read_moderation" ON forum_threads
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND is_moderator(auth.uid())
  );

-- Authors can see their own threads regardless of status
CREATE POLICY "forum_threads_read_own" ON forum_threads
  FOR SELECT
  USING (author_id = auth.uid() AND deleted_at IS NULL);

-- Any authenticated user can create a thread
CREATE POLICY "forum_threads_insert" ON forum_threads
  FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- Authors can update their own open threads
CREATE POLICY "forum_threads_update_own" ON forum_threads
  FOR UPDATE
  USING (author_id = auth.uid() AND status = 'OPEN' AND deleted_at IS NULL);

-- Moderators can update any thread (lock, hide, pin, etc.)
CREATE POLICY "forum_threads_update_moderator" ON forum_threads
  FOR UPDATE
  USING (is_moderator(auth.uid()));

-- Only admins can hard delete threads
CREATE POLICY "forum_threads_delete_admin" ON forum_threads
  FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- RLS policies for forum_replies
-- ============================================================================

ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read visible, non-deleted replies
CREATE POLICY "forum_replies_read_visible" ON forum_replies
  FOR SELECT
  USING (status = 'VISIBLE' AND deleted_at IS NULL);

-- Moderators can see all non-deleted replies (including hidden)
CREATE POLICY "forum_replies_read_moderation" ON forum_replies
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND is_moderator(auth.uid())
  );

-- Authors can see their own replies regardless of status
CREATE POLICY "forum_replies_read_own" ON forum_replies
  FOR SELECT
  USING (author_id = auth.uid() AND deleted_at IS NULL);

-- Any authenticated user can reply to a thread
CREATE POLICY "forum_replies_insert" ON forum_replies
  FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- Authors can update their own visible replies
CREATE POLICY "forum_replies_update_own" ON forum_replies
  FOR UPDATE
  USING (author_id = auth.uid() AND status = 'VISIBLE' AND deleted_at IS NULL);

-- Moderators can update any reply (hide, remove, etc.)
CREATE POLICY "forum_replies_update_moderator" ON forum_replies
  FOR UPDATE
  USING (is_moderator(auth.uid()));

-- Only admins can hard delete replies
CREATE POLICY "forum_replies_delete_admin" ON forum_replies
  FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- RLS policies for forum_reactions
-- ============================================================================

ALTER TABLE forum_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read reactions
CREATE POLICY "forum_reactions_read" ON forum_reactions
  FOR SELECT
  USING (true);

-- Users can add their own reactions
CREATE POLICY "forum_reactions_insert" ON forum_reactions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can remove their own reactions
CREATE POLICY "forum_reactions_delete_own" ON forum_reactions
  FOR DELETE
  USING (user_id = auth.uid());

-- Admins can remove any reaction
CREATE POLICY "forum_reactions_delete_admin" ON forum_reactions
  FOR DELETE
  USING (is_admin(auth.uid()));
