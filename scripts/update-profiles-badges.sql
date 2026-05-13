-- Add badge related columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_hiring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS open_to_work BOOLEAN DEFAULT false;

-- Function to automatically update is_hiring status based on active job listings
CREATE OR REPLACE FUNCTION update_user_hiring_status()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        -- Check if user has any active job listings
        UPDATE public.profiles
        SET is_hiring = EXISTS (
            SELECT 1 FROM public.jobs 
            WHERE posted_by = NEW.posted_by 
            AND status = 'active'
        )
        WHERE id = NEW.posted_by;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles
        SET is_hiring = EXISTS (
            SELECT 1 FROM public.jobs 
            WHERE posted_by = OLD.posted_by 
            AND status = 'active'
        )
        WHERE id = OLD.posted_by;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for job listings
DROP TRIGGER IF EXISTS tr_update_hiring_status ON public.jobs;
CREATE TRIGGER tr_update_hiring_status
AFTER INSERT OR UPDATE OR DELETE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION update_user_hiring_status();
