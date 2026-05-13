-- Add marketplace auto-approval setting to system_settings
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS marketplace_auto_approve BOOLEAN DEFAULT false;

-- Update the comments/schema info for clarity
COMMENT ON COLUMN public.system_settings.marketplace_auto_approve IS 'Automatically approve new marketplace listings when true';
