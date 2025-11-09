# Expenses Table

This folder contains database migration files for the `expenses` table.

## Schema

The `expenses` table stores expense records:

- `id` (UUID): Primary key, auto-generated
- `title` (TEXT): Name/title of the expense
- `group_id` (UUID): Optional reference to the group this expense belongs to
- `created_by` (UUID): Reference to the user who created the expense
- `currency` (TEXT): Currency code (e.g., 'USD', 'EUR')
- `created_at` (TIMESTAMP): When the expense was created
- `updated_at` (TIMESTAMP): When the expense was last updated

**Note:** The total amount is calculated as the sum of all `expense_payers.amount` for this expense.

## Cascade Behavior

- **When a group is deleted**: All expenses in that group are deleted (ON DELETE CASCADE)
- **When a user is deleted**: All expenses created by that user are deleted (ON DELETE CASCADE)

**Note:** Expenses can exist without a group (group_id can be NULL) for personal expenses between friends.

## Migration Files

1. `expenses-table-migration.sql` - Creates the expenses table with indexes
2. `expenses-rls-policies-migration.sql` - Sets up Row Level Security policies

## Execution Order

1. Run `expenses-table-migration.sql` first
2. Run `expenses-rls-policies-migration.sql` after

## Notes

- RLS is enabled but no policies are granted to regular users
- All operations are performed through API routes using the service role key
- Indexes are created on `group_id`, `created_by`, and `created_at` for performance

