-- Marketplace: allow listing OWNERS to update/delete their own products at any
-- status (the previous policy only allowed draft/rejected, and there was no
-- delete policy). Admin routes use the service-role client so they bypass RLS.

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS products_owner_update ON public.products;
CREATE POLICY products_owner_update ON public.products
  FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS products_owner_delete ON public.products;
CREATE POLICY products_owner_delete ON public.products
  FOR DELETE TO authenticated
  USING (auth.uid() = seller_id);
