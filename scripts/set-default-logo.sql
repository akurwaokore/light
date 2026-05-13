-- Create cms_settings table if it does not exist
CREATE TABLE IF NOT EXISTS cms_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE cms_settings ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies for cms_settings
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cms_settings' AND policyname = 'Anyone can view cms settings') THEN
        CREATE POLICY "Anyone can view cms settings" ON cms_settings FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cms_settings' AND policyname = 'Admins can manage cms settings') THEN
        CREATE POLICY "Admins can manage cms settings" ON cms_settings FOR ALL TO authenticated 
          USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND is_admin = true));
    END IF;
END $$;

-- Manually set the logo in cms_settings to the local public path
INSERT INTO cms_settings (key, value)
VALUES (
  'logo', 
  '{"url": "/logo.png", "alt": "Light Alumni Association"}'
)
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value;
