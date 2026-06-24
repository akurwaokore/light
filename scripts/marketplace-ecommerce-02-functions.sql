-- ============================================================================
-- marketplace-ecommerce-02-functions.sql
-- Race-safe order creation / stock reservation, expiry sweep, contact reveal.
-- Idempotent (CREATE OR REPLACE). Run after -01-schema.sql.
-- ============================================================================

-- Create one order per seller from the buyer's cart, RESERVING stock under a
-- row lock so concurrent buyers can't oversell. Returns the created order ids.
CREATE OR REPLACE FUNCTION public.create_order_from_cart(p_buyer uuid, p_provider text)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cart_id uuid;
  v_order_ids uuid[] := '{}';
  v_seller uuid;
  v_order_id uuid;
  r RECORD;
BEGIN
  IF p_buyer IS NULL OR p_buyer <> auth.uid() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT id INTO v_cart_id FROM carts WHERE buyer_id = p_buyer;
  IF v_cart_id IS NULL THEN RAISE EXCEPTION 'cart is empty'; END IF;

  -- Lock every product in the cart, validating availability up front.
  FOR r IN
    SELECT ci.product_id, ci.quantity, p.seller_id, p.price, p.title, p.status, p.quantity AS stock
    FROM cart_items ci JOIN products p ON p.id = ci.product_id
    WHERE ci.cart_id = v_cart_id
    ORDER BY ci.product_id
    FOR UPDATE OF p
  LOOP
    IF r.status NOT IN ('approved','active') THEN
      RAISE EXCEPTION 'product % is not available', r.product_id;
    END IF;
    IF r.stock < r.quantity THEN
      RAISE EXCEPTION 'insufficient stock for product %', r.product_id;
    END IF;
    IF r.seller_id = p_buyer THEN
      RAISE EXCEPTION 'cannot buy your own listing';
    END IF;
  END LOOP;

  IF NOT EXISTS (SELECT 1 FROM cart_items WHERE cart_id = v_cart_id) THEN
    RAISE EXCEPTION 'cart is empty';
  END IF;

  -- One order per distinct seller.
  FOR v_seller IN
    SELECT DISTINCT p.seller_id FROM cart_items ci JOIN products p ON p.id = ci.product_id
    WHERE ci.cart_id = v_cart_id
  LOOP
    INSERT INTO orders (buyer_id, seller_id, status, payment_provider, expires_at)
    VALUES (p_buyer, v_seller, 'pending_payment', p_provider, now() + interval '30 minutes')
    RETURNING id INTO v_order_id;

    INSERT INTO order_items (order_id, product_id, seller_id, title_snapshot, unit_price, quantity, line_total)
    SELECT v_order_id, p.id, p.seller_id, p.title, p.price, ci.quantity, p.price * ci.quantity
    FROM cart_items ci JOIN products p ON p.id = ci.product_id
    WHERE ci.cart_id = v_cart_id AND p.seller_id = v_seller;

    -- Reserve stock now (released by expire_stale_orders on timeout/failure).
    UPDATE products p SET quantity = p.quantity - ci.quantity, updated_at = now()
    FROM cart_items ci
    WHERE ci.cart_id = v_cart_id AND ci.product_id = p.id AND p.seller_id = v_seller;

    UPDATE orders o SET subtotal = s.t, total = s.t
    FROM (SELECT SUM(line_total) t FROM order_items WHERE order_id = v_order_id) s
    WHERE o.id = v_order_id;

    v_order_ids := array_append(v_order_ids, v_order_id);
  END LOOP;

  DELETE FROM cart_items WHERE cart_id = v_cart_id;
  RETURN v_order_ids;
END;$$;
GRANT EXECUTE ON FUNCTION public.create_order_from_cart(uuid, text) TO authenticated;

-- Release reserved stock for orders that never got paid.
CREATE OR REPLACE FUNCTION public.expire_stale_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count integer := 0; o RECORD;
BEGIN
  FOR o IN SELECT id FROM orders WHERE status = 'pending_payment' AND expires_at < now() FOR UPDATE LOOP
    UPDATE products p SET quantity = p.quantity + oi.quantity, updated_at = now()
    FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id;
    UPDATE orders SET status = 'expired', updated_at = now() WHERE id = o.id;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;$$;

-- Reveal buyer<->seller contact only to the counterparties of a paid+ order.
CREATE OR REPLACE FUNCTION public.get_order_contact(p_order_id uuid)
RETURNS TABLE (party text, full_name text, email text, phone text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE caller uuid := auth.uid(); o RECORD;
BEGIN
  SELECT * INTO o FROM orders WHERE id = p_order_id;
  IF o IS NULL OR caller IS NULL THEN RETURN; END IF;
  IF caller <> o.buyer_id AND caller <> o.seller_id
     AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = caller AND p.is_admin = true) THEN
    RETURN;
  END IF;
  IF o.status NOT IN ('paid','fulfilled') THEN RETURN; END IF;
  RETURN QUERY
    SELECT 'buyer', pr.display_name, pr.email, pr.phone FROM profiles pr WHERE pr.id = o.buyer_id
    UNION ALL
    SELECT 'seller', pr.display_name, pr.email, pr.phone FROM profiles pr WHERE pr.id = o.seller_id;
END;$$;
GRANT EXECUTE ON FUNCTION public.get_order_contact(uuid) TO authenticated;
