-- ============================================================================
-- Fix recursive content update policy
-- ============================================================================
-- The original content update policy queried the content table inside its own
-- WITH CHECK clause. PostgreSQL evaluates policies during the update, so that
-- self-reference can recurse and break publish/edit/delete flows with:
-- "infinite recursion detected in policy for relation \"content\"".
--
-- This migration replaces that policy with a non-recursive equivalent.
-- Authors can still update their own rows, and admins retain full access.
-- ============================================================================

DROP POLICY IF EXISTS "content_update_author" ON content;

CREATE POLICY "content_update_author" ON content
  FOR UPDATE
  USING (
    (author_id = auth.uid() OR is_admin(auth.uid()))
    AND deleted_at IS NULL
  )
  WITH CHECK (
    author_id = auth.uid() OR is_admin(auth.uid())
  );