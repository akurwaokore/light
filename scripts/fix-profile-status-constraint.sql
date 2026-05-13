-- Fix the profiles status check constraint to allow all used statuses
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;

-- Re-add the constraint with the full list of allowed statuses
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check 
CHECK (status IN ('active', 'inactive', 'suspended', 'studying', 'working', 'retired', 'other', 'pending', 'rejected'));

-- Also ensure existing data is valid (if any rows have null status, set to active)
UPDATE public.profiles SET status = 'active' WHERE status IS NULL;
