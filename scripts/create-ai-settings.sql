-- Single-row table holding the admin-configured AI assistant provider + creds.
-- Read/written only by server code using the service-role client (after an
-- in-code admin check), so RLS is enabled with no public policies.

CREATE TABLE IF NOT EXISTS public.ai_settings (
  id                 INT PRIMARY KEY DEFAULT 1,
  provider           TEXT NOT NULL DEFAULT 'openai',   -- 'openai' | 'gemini' | 'custom'
  enabled            BOOLEAN NOT NULL DEFAULT false,

  openai_api_key     TEXT,
  openai_model       TEXT DEFAULT 'gpt-4o-mini',

  gemini_api_key     TEXT,
  gemini_model       TEXT DEFAULT 'gemini-1.5-flash',

  -- Custom VPS / self-hosted LLM
  custom_url         TEXT,                              -- full endpoint URL
  custom_api_key     TEXT,                              -- optional auth token
  custom_model       TEXT,
  custom_auth_header TEXT DEFAULT 'Authorization',      -- header name for the token
  custom_auth_scheme TEXT DEFAULT 'Bearer',             -- prefix, e.g. 'Bearer' (blank = raw token)
  custom_format      TEXT DEFAULT 'openai',             -- 'openai' (chat/completions compatible) | 'simple' ({prompt}->text)

  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ai_settings_singleton CHECK (id = 1)
);

INSERT INTO public.ai_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
