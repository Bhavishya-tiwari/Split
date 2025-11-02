-- Create user_group_mapping table
CREATE TABLE IF NOT EXISTS public.user_group_mapping (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can only be added to a group once
  UNIQUE(user_id, group_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_group_mapping_user_id ON public.user_group_mapping(user_id);
CREATE INDEX IF NOT EXISTS idx_user_group_mapping_group_id ON public.user_group_mapping(group_id);

-- Enable Row Level Security
ALTER TABLE public.user_group_mapping ENABLE ROW LEVEL SECURITY;