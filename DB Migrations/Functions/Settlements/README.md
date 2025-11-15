# Settlements Functions

This folder contains database functions related to balance calculations and settlements.

## Available Functions

### `get_user_balance`

**File:** `get-group-balances-function.sql`

Calculates the financial balance details for a specific user in a group. This function is optimized to only calculate for the logged-in user, making it more efficient than calculating balances for all group members.

#### Features
- ✅ Calculates expense payments and splits for a single user
- ✅ Includes manual payments in balance calculation
- ✅ Returns detailed breakdown of who the user owes and who owes them
- ✅ Single efficient database query
- ✅ Only processes data for the specified user (more performant)

#### Parameters
- `p_group_id` (UUID) - The ID of the group
- `p_user_id` (UUID) - The ID of the user whose balance to calculate

#### Returns
- `user_id` - UUID of the user
- `total_paid` - Total amount paid by the user for expenses (does NOT include manual payments)
- `total_owed` - Total amount owed by the user from expense splits (does NOT include payments received)
- `net_balance` - Net balance = (expense_payments + payments_made) - (expense_splits + payments_received)
- `owes_to` - JSONB array of users the current user owes, with structure:
  ```json
  [
    {
      "user_id": "uuid",
      "amount": 123.45
    }
  ]
  ```
- `owed_by` - JSONB array of users who owe the current user, with structure:
  ```json
  [
    {
      "user_id": "uuid",
      "amount": 67.89
    }
  ]
  ```

#### Usage Example

```sql
-- Get balance for a specific user in a group
SELECT * FROM get_user_balance(
  'group-uuid-here',
  'user-uuid-here'
);
```

#### How It Works

1. **Total Paid**: Sums all amounts from `expense_payers` where the user is the payer
2. **Total Owed**: Sums all amounts from `expense_splits` where the user is included
3. **Net Balance**: Calculates `(total_paid + payments_made) - (total_owed + payments_received)`
4. **Owes To**: For each expense where the user has a split but didn't pay, calculates their proportional share owed to each payer, then subtracts any manual payments made
5. **Owed By**: For each expense where the user paid, calculates how much each split member owes them proportionally, then subtracts any manual payments received

#### Performance Benefits

- Only queries data relevant to the specified user
- Filters at the database level for maximum efficiency
- Returns structured JSONB data ready for API consumption
- No need to calculate all group balances when only one user's data is needed

## Implementation Guide

See `SETTLEMENTS_IMPLEMENTATION_GUIDE.md` for complete implementation instructions including:
- Step-by-step setup
- API route creation
- React Query hooks
- UI components
- Testing procedures

## Related Documentation

- [Payments Table Migration](../../Payments%20table/README.md)
- [Expenses Table Migration](../../Expenses%20table/README.md)
- [Expense Splits Migration](../../Expense%20Splits%20table/README.md)
