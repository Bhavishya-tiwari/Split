-- RLS policies for user_group_mapping table

-- NOTE: No policies are defined for ANON or authenticated users
-- All database operations (SELECT, INSERT, UPDATE, DELETE) are performed
-- exclusively through API routes using the service role key, which bypasses RLS
-- This ensures complete server-side control over data access and security

-- RLS is enabled on the table (in user-group-mapping-migration.sql) but no policies
-- are granted to ANON or authenticated roles, effectively blocking all direct access

-- If you previously had policies granting read access to ANON/authenticated users,
-- remove them by running:
-- DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_group_mapping;
-- DROP POLICY IF EXISTS "Users can view group memberships of their groups" ON public.user_group_mapping;