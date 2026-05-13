-- Update system_settings to include Pesapal keys

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'pesapal_consumer_key') THEN
        ALTER TABLE public.system_settings ADD COLUMN pesapal_consumer_key TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'pesapal_consumer_secret') THEN
        ALTER TABLE public.system_settings ADD COLUMN pesapal_consumer_secret TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'pesapal_environment') THEN
        ALTER TABLE public.system_settings ADD COLUMN pesapal_environment VARCHAR(20) DEFAULT 'sandbox';
    END IF;
END $$;
