-- ============================================================================
-- AUTOMATIC UPDATED_AT TRIGGER SETUP
-- ============================================================================
-- This migration creates a reusable function and triggers to automatically
-- update the 'updated_at' timestamp whenever a row is modified.
-- ============================================================================

-- Create a function that updates the updated_at column
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- APPLY TRIGGERS TO ALL TABLES
-- ============================================================================

-- Trigger for profiles table
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for groups table
DROP TRIGGER IF EXISTS set_updated_at_groups ON public.groups;
CREATE TRIGGER set_updated_at_groups
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for user_group_mapping table
DROP TRIGGER IF EXISTS set_updated_at_user_group_mapping ON public.user_group_mapping;
CREATE TRIGGER set_updated_at_user_group_mapping
  BEFORE UPDATE ON public.user_group_mapping
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for expenses table
DROP TRIGGER IF EXISTS set_updated_at_expenses ON public.expenses;
CREATE TRIGGER set_updated_at_expenses
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for expense_payers table
DROP TRIGGER IF EXISTS set_updated_at_expense_payers ON public.expense_payers;
CREATE TRIGGER set_updated_at_expense_payers
  BEFORE UPDATE ON public.expense_payers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for expense_splits table
DROP TRIGGER IF EXISTS set_updated_at_expense_splits ON public.expense_splits;
CREATE TRIGGER set_updated_at_expense_splits
  BEFORE UPDATE ON public.expense_splits
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- List all triggers created
SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation as event
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'set_updated_at_%'
ORDER BY event_object_table;

-- ============================================================================
-- USAGE NOTES
-- ============================================================================
-- After running this migration:
-- 1. The 'updated_at' column will automatically update whenever a row is modified
-- 2. You don't need to manually set 'updated_at' in your UPDATE queries
-- 3. The trigger runs BEFORE UPDATE, so the new timestamp is included in the update
-- 
-- Example:
-- UPDATE public.groups SET name = 'New Name' WHERE id = 'some-id';
-- -- The updated_at field will automatically be set to NOW()
-- ============================================================================

