-- ============================================================================
-- marketplace-ecommerce-01-schema.sql
-- Cart + orders + payments + reviews for the modern marketplace.
-- Targets the LIVE `products` table (confirmed columns include quantity-less
-- stock, status CHECK allows pending_approval/approved/sold/...). Idempotent.
-- ============================================================================

-- ---------- products: stock ----------
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='products_quantity_nonneg') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_quantity_nonneg CHECK (quantity >= 0);
  END IF;
END$$;
-- Items previously flagged sold have no stock.
UPDATE public.products SET quantity = 0 WHERE status = 'sold' AND quantity > 0;
CREATE INDEX IF NOT EXISTS idx_products_status_category ON public.products(status, category);
CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id);

-- ---------- carts ----------
CREATE TABLE IF NOT EXISTS public.carts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (buyer_id)
);
CREATE TABLE IF NOT EXISTS public.cart_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id    uuid NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity   integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL DEFAULT 0,
  added_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cart_id, product_id)
);

-- ---------- orders ----------
CREATE TABLE IF NOT EXISTS public.orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status           text NOT NULL DEFAULT 'pending_payment'
                   CHECK (status IN ('pending_payment','paid','failed','cancelled','expired','fulfilled','refunded')),
  subtotal         numeric NOT NULL DEFAULT 0,
  total            numeric NOT NULL DEFAULT 0,
  currency         text NOT NULL DEFAULT 'KES',
  payment_provider text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  paid_at          timestamptz,
  expires_at       timestamptz
);
CREATE TABLE IF NOT EXISTS public.order_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id     uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  seller_id      uuid NOT NULL,
  title_snapshot text NOT NULL,
  unit_price     numeric NOT NULL,
  quantity       integer NOT NULL CHECK (quantity > 0),
  line_total     numeric NOT NULL
);

-- ---------- payments ----------
CREATE TABLE IF NOT EXISTS public.payments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  buyer_id            uuid NOT NULL,
  provider            text NOT NULL CHECK (provider IN ('mpesa','pesapal','paypal')),
  provider_ref        text,
  checkout_request_id text,
  status              text NOT NULL DEFAULT 'initiated'
                      CHECK (status IN ('initiated','pending','success','failed','cancelled')),
  amount              numeric NOT NULL,
  currency            text NOT NULL DEFAULT 'KES',
  raw_callback        jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_provider_ref ON public.payments(provider, provider_ref) WHERE provider_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_checkout ON public.payments(checkout_request_id) WHERE checkout_request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_expiry ON public.orders(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- ---------- reviews ----------
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id    uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id   uuid NOT NULL,
  rating      integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, product_id, reviewer_id)
);
CREATE OR REPLACE VIEW public.seller_rating_summary AS
SELECT seller_id, ROUND(AVG(rating)::numeric, 2) AS avg_rating, COUNT(*) AS review_count
FROM public.product_reviews GROUP BY seller_id;
GRANT SELECT ON public.seller_rating_summary TO anon, authenticated;

-- ============================ RLS ============================
ALTER TABLE public.carts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- carts: owner only
DROP POLICY IF EXISTS carts_owner ON public.carts;
CREATE POLICY carts_owner ON public.carts FOR ALL TO authenticated
  USING (buyer_id = auth.uid()) WITH CHECK (buyer_id = auth.uid());

-- cart_items: owner via parent cart
DROP POLICY IF EXISTS cart_items_owner ON public.cart_items;
CREATE POLICY cart_items_owner ON public.cart_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND c.buyer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND c.buyer_id = auth.uid()));

-- orders: buyer or seller may read; writes happen via service role / RPC
DROP POLICY IF EXISTS orders_party_read ON public.orders;
CREATE POLICY orders_party_read ON public.orders FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- order_items: visible to the parent order's buyer or seller
DROP POLICY IF EXISTS order_items_party_read ON public.order_items;
CREATE POLICY order_items_party_read ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id
                 AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid()
                      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))));

-- payments: buyer + admin only (hide raw_callback from seller)
DROP POLICY IF EXISTS payments_buyer_read ON public.payments;
CREATE POLICY payments_buyer_read ON public.payments FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- product_reviews: anyone authenticated reads; only a buyer who paid for the
-- product may insert; reviewer may edit/delete own.
DROP POLICY IF EXISTS reviews_read ON public.product_reviews;
CREATE POLICY reviews_read ON public.product_reviews FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS reviews_insert_purchaser ON public.product_reviews;
CREATE POLICY reviews_insert_purchaser ON public.product_reviews FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.orders o JOIN public.order_items oi ON oi.order_id = o.id
      WHERE o.id = product_reviews.order_id AND o.buyer_id = auth.uid()
        AND o.status IN ('paid','fulfilled') AND oi.product_id = product_reviews.product_id
    )
  );
DROP POLICY IF EXISTS reviews_modify_own ON public.product_reviews;
CREATE POLICY reviews_modify_own ON public.product_reviews FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid()) WITH CHECK (reviewer_id = auth.uid());
DROP POLICY IF EXISTS reviews_delete_own ON public.product_reviews;
CREATE POLICY reviews_delete_own ON public.product_reviews FOR DELETE TO authenticated
  USING (reviewer_id = auth.uid());
