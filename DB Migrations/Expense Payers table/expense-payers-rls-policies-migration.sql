-- RLS policies for expense_payers table
-- This migration should be run AFTER the expense_payers table is created

-- NOTE: No policies are defined for ANON or authenticated users
-- All database operations (SELECT, INSERT, UPDATE, DELETE) are performed
-- exclusively through API routes using the service role key, which bypasses RLS
-- This ensures complete server-side control over data access and security

-- RLS is enabled on the table (in expense-payers-migration.sql) but no policies
-- are granted to ANON or authenticated roles, effectively blocking all direct access

