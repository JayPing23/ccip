-- ============================================================================
-- Phase 3: Publication domain — additive tables for campus journalism
-- ============================================================================
-- Adds `articles` and `article_authors` tables.  These are separate from the
-- existing `content` table which remains the foundation for official
-- announcements.
--
-- Constraints:
--   - additive only (no modifications to existing tables)
--   - RLS enabled on every new table
--   - soft delete via deleted_at
--   - editorial workflow states: DRAFT → IN_REVIEW → APPROVED → PUBLISHED → ARCHIVED
-- ============================================================================

-- ============================================================================
-- TABLE: articles
-- ============================================================================

CREATE TABLE IF NOT EXISTS articles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL DEFAULT '',
  slug        TEXT NOT NULL UNIQUE,
  excerpt     TEXT,
  section     TEXT NOT NULL DEFAULT 'NEWS'
              CHECK (section IN ('NEWS','FEATURES','OPINION','EDITORIAL','SPORTS','CULTURE')),
  status      TEXT NOT NULL DEFAULT 'DRAFT'
              CHECK (status IN ('DRAFT','IN_REVIEW','APPROVED','PUBLISHED','ARCHIVED')),
  author_id   UUID NOT NULL REFERENCES users(id),
  reviewer_id UUID REFERENCES users(id),
  review_note TEXT,
  published_at  TIMESTAMPTZ,
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_slug       ON articles (slug);
CREATE INDEX IF NOT EXISTS idx_articles_status     ON articles (status);
CREATE INDEX IF NOT EXISTS idx_articles_section    ON articles (section);
CREATE INDEX IF NOT EXISTS idx_articles_author     ON articles (author_id);
CREATE INDEX IF NOT EXISTS idx_articles_deleted_at ON articles (deleted_at);

-- ============================================================================
-- TABLE: article_authors  (byline / co-author junction)
-- ============================================================================

CREATE TABLE IF NOT EXISTS article_authors (
  article_id  UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'primary'
              CHECK (role IN ('primary','contributor')),
  byline_name TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (article_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_article_authors_user ON article_authors (user_id);

-- ============================================================================
-- RLS policies for articles
-- ============================================================================

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read published, non-deleted articles
CREATE POLICY "articles_read_published" ON articles
  FOR SELECT
  USING (status = 'PUBLISHED' AND deleted_at IS NULL);

-- Editors can see all non-deleted articles (drafts, in-review, etc.)
CREATE POLICY "articles_read_editorial" ON articles
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND is_editor(auth.uid())
  );

-- Authors can see their own articles regardless of status
CREATE POLICY "articles_read_own" ON articles
  FOR SELECT
  USING (author_id = auth.uid() AND deleted_at IS NULL);

-- Editors can create articles
CREATE POLICY "articles_insert" ON articles
  FOR INSERT
  WITH CHECK (is_editor(auth.uid()));

-- Authors can update their own articles
CREATE POLICY "articles_update_own" ON articles
  FOR UPDATE
  USING (author_id = auth.uid() AND deleted_at IS NULL);

-- Admins can update any article (editorial review, publish, archive)
CREATE POLICY "articles_update_admin" ON articles
  FOR UPDATE
  USING (is_admin(auth.uid()));

-- Only admins can delete (soft-delete is an UPDATE, hard delete is admin only)
CREATE POLICY "articles_delete_admin" ON articles
  FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================================================
-- RLS policies for article_authors
-- ============================================================================

ALTER TABLE article_authors ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read bylines of published articles
CREATE POLICY "article_authors_read_published" ON article_authors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM articles a
      WHERE a.id = article_id
        AND a.status = 'PUBLISHED'
        AND a.deleted_at IS NULL
    )
  );

-- Editors can read all bylines
CREATE POLICY "article_authors_read_editorial" ON article_authors
  FOR SELECT
  USING (is_editor(auth.uid()));

-- Editors can manage bylines
CREATE POLICY "article_authors_insert" ON article_authors
  FOR INSERT
  WITH CHECK (is_editor(auth.uid()));

CREATE POLICY "article_authors_update" ON article_authors
  FOR UPDATE
  USING (is_editor(auth.uid()));

CREATE POLICY "article_authors_delete" ON article_authors
  FOR DELETE
  USING (is_editor(auth.uid()));
