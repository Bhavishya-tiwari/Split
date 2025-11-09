-- Create expense_payers table
-- This table tracks who paid for an expense and how much
CREATE TABLE IF NOT EXISTS public.expense_payers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  paid_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure amount is positive
  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_expense_payers_expense_id ON public.expense_payers(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_payers_paid_by ON public.expense_payers(paid_by);

-- Enable Row Level Security
ALTER TABLE public.expense_payers ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be added in separate file
-- See: expense-payers-rls-policies-migration.sql

-- Note: CREATE, UPDATE, and DELETE operations will be handled via API routes 
-- using the service role key, which bypasses RLS

