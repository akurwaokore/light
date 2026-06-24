-- ============================================================================
-- reconcile-02-transactions.sql
-- The membership `transactions` table is missing columns the M-Pesa flow uses
-- (checkout_request_id, phone_number, mpesa_receipt, ...), so subscription
-- payments were failing. Idempotent.
-- ============================================================================
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS checkout_request_id text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS phone_number        text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS mpesa_receipt       text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transaction_date    text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS error_message       text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS updated_at          timestamptz DEFAULT now();
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS metadata            jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_transactions_checkout ON public.transactions(checkout_request_id) WHERE checkout_request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);
