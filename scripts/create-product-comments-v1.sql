-- ============================================================================
-- create-product-comments-v1.sql
-- Creates the `product_comments` table referenced by
-- app/api/marketplace/products/[id]/comments/route.ts (which currently 500s
-- because the table does not exist). Idempotent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.product_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_comments_product ON public.product_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_author  ON public.product_comments(author_id);

ALTER TABLE public.product_comments ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read comments on a listing.
DROP POLICY IF EXISTS "Product comments are viewable by authenticated users" ON public.product_comments;
CREATE POLICY "Product comments are viewable by authenticated users"
  ON public.product_comments FOR SELECT
  TO authenticated
  USING (true);

-- A user may only insert comments authored by themselves.
DROP POLICY IF EXISTS "Users can add their own product comments" ON public.product_comments;
CREATE POLICY "Users can add their own product comments"
  ON public.product_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- A user may only delete their own comments.
DROP POLICY IF EXISTS "Users can delete their own product comments" ON public.product_comments;
CREATE POLICY "Users can delete their own product comments"
  ON public.product_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);
