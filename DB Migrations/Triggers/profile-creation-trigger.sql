-- ============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- ============================================================================
-- This trigger automatically creates a profile in public.profiles whenever
-- a new user signs up through Supabase Auth.
--
-- NOTE: This trigger is also included in Users table/supabase-profiles-migration.sql
-- This file is provided for reference and standalone deployment if needed.
-- ============================================================================

-- Create a function to automatically create a profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check if the trigger exists
SELECT 
  trigger_name,
  event_object_schema,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check if the function exists
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'handle_new_user';

-- ============================================================================
-- HOW IT WORKS
-- ============================================================================
--
-- 1. User signs up via Supabase Auth (auth.signUp())
-- 2. New row inserted into auth.users table
-- 3. Trigger 'on_auth_user_created' fires automatically
-- 4. Function 'handle_new_user()' executes
-- 5. New profile created in public.profiles with:
--    - id: Copied from auth.users.id
--    - email: Copied from auth.users.email
--    - full_name: Extracted from raw_user_meta_data
--    - created_at: Set to NOW()
-- 6. User can now access the application
--
-- ============================================================================
-- EXAMPLE SIGNUP DATA
-- ============================================================================
--
-- When signing up, pass full_name in metadata:
--
-- const { data, error } = await supabase.auth.signUp({
--   email: 'user@example.com',
--   password: 'secure_password',
--   options: {
--     data: {
--       full_name: 'John Doe'
--     }
--   }
-- })
--
-- This data becomes available in raw_user_meta_data->>'full_name'
--
-- ============================================================================
-- SECURITY NOTES
-- ============================================================================
--
-- SECURITY DEFINER:
-- - The function runs with the privileges of the user who created it
-- - This is necessary because the user isn't authenticated yet during signup
-- - The function bypasses RLS to insert into public.profiles
-- - Only extracts safe fields from auth.users (id, email, metadata)
--
-- ============================================================================
-- TESTING
-- ============================================================================
--
-- To test this trigger, sign up a new user through your application:
--
-- 1. Use Supabase Auth signup
-- 2. Check if profile was created:
--
-- SELECT * FROM public.profiles 
-- WHERE email = 'test@example.com';
--
-- 3. Verify the full_name was extracted correctly
--
-- ============================================================================

