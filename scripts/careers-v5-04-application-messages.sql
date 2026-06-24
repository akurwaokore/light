-- ============================================================================
-- careers-v5-04-application-messages.sql
-- Dedicated recruiting message thread per application. Intentionally NOT the
-- chat_* tables, so the friends-only rule never applies to recruiting.
-- Idempotent. Depends on is_application_party() from careers-v5-03.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.application_messages (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  sender_id      uuid NOT NULL,
  content        text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
  read_at        timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_app_messages_app ON public.application_messages(application_id, created_at);

ALTER TABLE public.application_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_messages_read ON public.application_messages;
CREATE POLICY app_messages_read ON public.application_messages FOR SELECT TO authenticated
  USING (public.is_application_party(application_id));

DROP POLICY IF EXISTS app_messages_send ON public.application_messages;
CREATE POLICY app_messages_send ON public.application_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_application_party(application_id));

DROP POLICY IF EXISTS app_messages_mark_read ON public.application_messages;
CREATE POLICY app_messages_mark_read ON public.application_messages FOR UPDATE TO authenticated
  USING (public.is_application_party(application_id));
