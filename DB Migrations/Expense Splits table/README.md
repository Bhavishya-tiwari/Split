# Expense Splits Table

This folder contains database migration files for the `expense_splits` table.

## Schema

The `expense_splits` table tracks how an expense is split among users:

- `id` (UUID): Primary key, auto-generated
- `expense_id` (UUID): Reference to the expense
- `user_id` (UUID): Reference to the user who owes this split
- `amount` (NUMERIC): Amount owed by this user
- `split_type` (TEXT): How the split was calculated ('equal', 'percentage', 'exact', 'shares')
- `percentage` (NUMERIC): Percentage of total if split_type is 'percentage'
- `shares` (INTEGER): Number of shares if split_type is 'shares'
- `created_at` (TIMESTAMP): When the split record was created
- `updated_at` (TIMESTAMP): When the split record was last updated

## Cascade Behavior

- **When an expense is deleted**: All split records for that expense are deleted (ON DELETE CASCADE)
- **When a user is deleted**: All split records for that user are deleted (ON DELETE CASCADE)

## Constraints

- Amount must be non-negative (CHECK constraint)
- Percentage must be between 0 and 100 if provided
- Shares must be positive if provided
- Each user can only have one split per expense (UNIQUE constraint on expense_id, user_id)

## Split Types

- **equal**: Split equally among all participants
- **percentage**: Split by percentage (percentage field used)
- **exact**: Exact amount specified
- **shares**: Split by shares (shares field used)

## Migration Files

1. `expense-splits-migration.sql` - Creates the expense_splits table with indexes
2. `expense-splits-rls-policies-migration.sql` - Sets up Row Level Security policies

## Execution Order

1. Ensure `expenses` table is created first
2. Run `expense-splits-migration.sql`
3. Run `expense-splits-rls-policies-migration.sql` after

## Notes

- RLS is enabled but no policies are granted to regular users
- All operations are performed through API routes using the service role key
- Multiple users can split a single expense
- The sum of all splits for an expense should equal the total_amount in the expenses table
- Indexes are created on `expense_id` and `user_id` for performance

