-- Add icon column to groups table to store icon identifier
-- The icon column will store the name of a lucide-react icon (e.g., 'Users', 'Home', 'Briefcase')
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'Users';

-- Add a comment to explain the column
COMMENT ON COLUMN public.groups.icon IS 'Stores the identifier for a lucide-react icon to represent the group';

