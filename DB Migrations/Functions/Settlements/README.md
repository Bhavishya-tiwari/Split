# Settlements Functions

This folder contains database functions related to balance calculations and settlements.

## Available Functions

### `get_group_balances`

**File:** `get-group-balances-function.sql`  
**Documentation:** `get-group-balances-function-README.md`

Calculates the financial balances for all members in a group. It aggregates expense payments, expense splits, and manual payments to determine each member's net balance.

#### Features
- ✅ Calculates expense payments and splits
- ✅ Includes manual payments in balance calculation
- ✅ Returns balances for all group members
- ✅ Single efficient database query
- ✅ Handles members with no expenses

#### Returns
- `user_id` - UUID of the group member
- `total_paid` - Total amount paid for expenses (does NOT include manual payments)
- `total_owed` - Total amount owed from expense splits (does NOT include payments received)
- `balance` - Net balance = (expense_payments + payments_made) - (expense_splits + payments_received)

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

