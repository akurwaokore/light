-- Create system_settings table to store platform-wide configurations
CREATE TABLE IF NOT EXISTS public.system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    siteName TEXT DEFAULT 'Light Alumni Connect',
    siteDescription TEXT DEFAULT 'Official alumni platform for Light Academy',
    adminEmail TEXT DEFAULT 'admin@lightalumni.com',
    supportEmail TEXT DEFAULT 'support@lightalumni.com',
    defaultCurrency TEXT DEFAULT 'KES',
    enableRegistration BOOLEAN DEFAULT true,
    requireEmailVerification BOOLEAN DEFAULT false,
    enableMarketplace BOOLEAN DEFAULT true,
    marketplaceCommission TEXT DEFAULT '5',
    enableDonations BOOLEAN DEFAULT true,
    enableEvents BOOLEAN DEFAULT true,
    maxEventAttendees TEXT DEFAULT '500',
    enableJobBoard BOOLEAN DEFAULT true,
    emailNotifications BOOLEAN DEFAULT true,
    pushNotifications BOOLEAN DEFAULT false,
    maintenanceMode BOOLEAN DEFAULT false,
    analyticsEnabled BOOLEAN DEFAULT true,
    pesapalConsumerKey TEXT DEFAULT '',
    pesapalConsumerSecret TEXT DEFAULT '',
    pesapalEnvironment TEXT DEFAULT 'sandbox',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT one_row_only CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access for authenticated users" ON public.system_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow update access only for admins
-- This policy assumes an 'is_admin' column in the profiles table
CREATE POLICY "Allow update for admins" ON public.system_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Insert initial row if it doesn't exist
INSERT INTO public.system_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
