-- Individual donation records (one row per donation attempt), used by the
-- M-Pesa STK-push flow. Campaign totals live on donation_campaigns.current_amount.

CREATE TABLE IF NOT EXISTS public.donations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id         UUID REFERENCES public.donation_campaigns(id) ON DELETE SET NULL,
  donor_id            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  donor_name          TEXT,
  amount              NUMERIC(12,2) NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'KES',
  phone               TEXT,
  provider            TEXT NOT NULL DEFAULT 'mpesa',
  status              TEXT NOT NULL DEFAULT 'pending', -- pending | completed | failed
  checkout_request_id TEXT,
  merchant_request_id TEXT,
  mpesa_receipt       TEXT,
  result_desc         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_donations_campaign ON public.donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_checkout ON public.donations(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor ON public.donations(donor_id);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- A donor can see their own donations; the server/callback uses the service
-- role (bypasses RLS) for inserts and the campaign-total update.
DROP POLICY IF EXISTS donations_select_own ON public.donations;
CREATE POLICY donations_select_own ON public.donations
  FOR SELECT USING (donor_id = auth.uid());

DROP POLICY IF EXISTS donations_insert_own ON public.donations;
CREATE POLICY donations_insert_own ON public.donations
  FOR INSERT WITH CHECK (donor_id = auth.uid());

-- Atomically add a completed donation to a campaign's running total.
CREATE OR REPLACE FUNCTION public.increment_campaign_amount(p_campaign_id UUID, p_amount NUMERIC)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.donation_campaigns
  SET current_amount = COALESCE(current_amount, 0) + p_amount,
      updated_at = now()
  WHERE id = p_campaign_id;
$$;
