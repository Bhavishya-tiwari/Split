-- Create expense_splits table
-- This table tracks how an expense is split among users
CREATE TABLE IF NOT EXISTS public.expense_splits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  split_type TEXT DEFAULT 'equal' CHECK (split_type IN ('equal', 'percentage', 'exact', 'shares')),
  percentage NUMERIC(5, 2),
  shares INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure amount is positive
  CONSTRAINT positive_split_amount CHECK (amount >= 0),
  -- Ensure percentage is between 0 and 100 if provided
  CONSTRAINT valid_percentage CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100)),
  -- Ensure shares is positive if provided
  CONSTRAINT positive_shares CHECK (shares IS NULL OR shares > 0),
  -- Ensure a user can only be split once per expense
  UNIQUE(expense_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON public.expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user_id ON public.expense_splits(user_id);

-- Enable Row Level Security
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be added in separate file
-- See: expense-splits-rls-policies-migration.sql

-- Note: CREATE, UPDATE, and DELETE operations will be handled via API routes 
-- using the service role key, which bypasses RLS

