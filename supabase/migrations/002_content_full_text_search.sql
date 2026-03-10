-- ============================================================================
-- Full-Text Search for Content (Announcements)
-- ============================================================================
-- Additive migration: adds a generated tsvector column, a GIN index, and a
-- helper SQL function so the search service can run ts_query lookups.
--
-- This migration does NOT alter existing columns or remove any data.
-- ============================================================================

-- 1. Add a stored generated tsvector column combining title (weight A) and
--    body (weight B) for ranked full-text search.
ALTER TABLE content
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B')
  ) STORED;

-- 2. Create a GIN index for fast full-text lookups.
CREATE INDEX IF NOT EXISTS idx_content_search_vector
  ON content USING GIN (search_vector);

-- 3. Add a btree index on published_at for sort-by-date queries that
--    accompany search results.
CREATE INDEX IF NOT EXISTS idx_content_published_at
  ON content (published_at DESC NULLS LAST)
  WHERE deleted_at IS NULL;
