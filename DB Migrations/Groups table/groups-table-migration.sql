-- Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON public.groups(created_by);

-- Enable Row Level Security
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be added after user_group_mapping table is created
-- See: groups-rls-policies-migration.sql

-- Note: CREATE, UPDATE, and DELETE operations will be handled via API routes 
-- using the service role key, which bypasses RLS

