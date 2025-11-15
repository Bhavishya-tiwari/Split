-- Create payments table
-- This table tracks manual payments made between users to settle debts
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure amount is positive
  CONSTRAINT positive_payment_amount CHECK (amount > 0),
  -- Ensure user doesn't pay themselves
  CONSTRAINT no_self_payment CHECK (from_user_id != to_user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_group_id ON public.payments(group_id);
CREATE INDEX IF NOT EXISTS idx_payments_from_user_id ON public.payments(from_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_to_user_id ON public.payments(to_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be added in separate file
-- See: payments-rls-policies-migration.sql

-- Note: CREATE, UPDATE, and DELETE operations will be handled via API routes 
-- using the service role key, which bypasses RLS

