# Expense Payers Table

This folder contains database migration files for the `expense_payers` table.

## Schema

The `expense_payers` table tracks who paid for an expense and how much they paid:

- `id` (UUID): Primary key, auto-generated
- `expense_id` (UUID): Reference to the expense
- `paid_by` (UUID): Reference to the user who made the payment
- `amount` (NUMERIC): Amount paid by this user
- `created_at` (TIMESTAMP): When the payment record was created
- `updated_at` (TIMESTAMP): When the payment record was last updated

## Cascade Behavior

- **When an expense is deleted**: All payment records for that expense are deleted (ON DELETE CASCADE)
- **When a user is deleted**: All payment records made by that user are deleted (ON DELETE CASCADE)

## Constraints

- Amount must be positive (CHECK constraint)

## Migration Files

1. `expense-payers-migration.sql` - Creates the expense_payers table with indexes
2. `expense-payers-rls-policies-migration.sql` - Sets up Row Level Security policies

## Execution Order

1. Ensure `expenses` table is created first
2. Run `expense-payers-migration.sql`
3. Run `expense-payers-rls-policies-migration.sql` after

## Notes

- RLS is enabled but no policies are granted to regular users
- All operations are performed through API routes using the service role key
- Multiple users can pay for a single expense
- Indexes are created on `expense_id` and `paid_by` for performance

