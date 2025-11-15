# Expenses Functions

This folder contains database functions related to expense management.

## Available Functions

### `upsert_expense_from_json`

**File:** `upsert-expense-function.sql`

Creates or updates an expense with payers and splits from JSON input. This function handles the entire expense creation/update process in a single atomic transaction.

> **Note:** This function has been simplified to focus on data mutation only. All business logic validation is now handled by the API layer for better separation of concerns and maintainability.

#### Features
- ✅ Creates new expenses or updates existing ones
- ✅ Handles expense payers and splits automatically
- ✅ Transaction-safe (all-or-nothing)
- ✅ Clean separation: API validates, DB mutates
- ✅ Faster execution (no validation overhead)

#### What This Function Does
- Extract data from JSON input
- CREATE or UPDATE expense record
- Manage expense_payers records (delete old, insert new)
- Manage expense_splits records (delete old, insert new)
- Return the expense UUID

#### Supported Split Types
- `equal` - Split equally among selected members
- `exact` - Manually specify exact amounts for each member

## Usage

See the main [Functions README](../README.md) for detailed usage examples and execution instructions.

## Related Documentation

- [Expenses Table Migration](../../Expenses%20table/expenses-table-migration.sql)
- [Expense Payers Migration](../../Expense%20Payers%20table/expense-payers-migration.sql)
- [Expense Splits Migration](../../Expense%20Splits%20table/expense-splits-migration.sql)

