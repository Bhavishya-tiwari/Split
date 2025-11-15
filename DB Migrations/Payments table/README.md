# Payments Table

This folder contains database migration files for the `payments` table.

## Schema

The `payments` table tracks manual payments made between users to settle debts within a group:

- `id` (UUID): Primary key, auto-generated
- `group_id` (UUID): Reference to the group this payment belongs to
- `from_user_id` (UUID): Reference to the user who made the payment
- `to_user_id` (UUID): Reference to the user who received the payment
- `amount` (NUMERIC): Amount of the payment
- `created_by` (UUID): Reference to the user who recorded this payment
- `notes` (TEXT): Optional notes about the payment
- `created_at` (TIMESTAMP): When the payment record was created
- `updated_at` (TIMESTAMP): When the payment record was last updated

## Cascade Behavior

- **When a group is deleted**: All payment records for that group are deleted (ON DELETE CASCADE)
- **When a user is deleted**: All payment records involving that user are deleted (ON DELETE CASCADE)

## Constraints

- Amount must be positive (CHECK constraint)
- User cannot pay themselves (CHECK constraint: `from_user_id != to_user_id`)

## Migration Files

1. `payments-table-migration.sql` - Creates the payments table with indexes
2. `payments-rls-policies-migration.sql` - Sets up Row Level Security policies

## Execution Order

1. Ensure `groups` table is created first
2. Ensure `profiles` table is created first
3. Run `payments-table-migration.sql`
4. Run `payments-rls-policies-migration.sql` after

## Notes

- RLS is enabled but no policies are granted to regular users
- All operations are performed through API routes using the service role key
- Payments are used to adjust balances when calculating settlements
- Indexes are created on `group_id`, `from_user_id`, `to_user_id`, and `created_at` for performance
- The `created_by` field tracks who recorded the payment (useful for audit trails)

## Usage in Settlements

Payments are subtracted from the balance calculation:
- If User A pays User B $50, User A's balance increases by $50 (they've paid off debt)
- If User A pays User B $50, User B's balance decreases by $50 (they've received payment)

This is handled in the `get_group_balances` SQL function by aggregating payments.

