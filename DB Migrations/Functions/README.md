# Database Functions

This folder contains reusable PostgreSQL functions for the Split App, organized by feature area.

## 📁 Folder Structure

```
Functions/
├── Expenses/              # Expense management functions
│   ├── upsert-expense-function.sql
│   └── README.md
├── Settlements/           # Balance and settlement functions
│   ├── get-group-balances-function.sql
│   ├── get-group-balances-function-README.md
│   ├── SETTLEMENTS_IMPLEMENTATION_GUIDE.md
│   └── README.md
└── README.md             # This file (overview)
```

## Available Functions

### Expenses Functions

See [`Expenses/README.md`](./Expenses/README.md) for details.

#### `upsert_expense_from_json`
**Location:** `Expenses/upsert-expense-function.sql`

Creates or updates an expense with payers and splits from JSON input. This function handles the entire expense creation/update process in a single atomic transaction.

> **Note:** This function has been simplified to focus on data mutation only. All business logic validation is now handled by the API layer for better separation of concerns and maintainability.

**Features:**
- ✅ Creates new expenses or updates existing ones
- ✅ Handles expense payers and splits automatically
- ✅ Transaction-safe (all-or-nothing)
- ✅ Clean separation: API validates, DB mutates
- ✅ Faster execution (no validation overhead)

### Settlements Functions

See [`Settlements/README.md`](./Settlements/README.md) for details.

#### `get_group_balances`
**Location:** `Settlements/get-group-balances-function.sql`

Calculates the financial balances for all members in a group. It aggregates expense payments, expense splits, and manual payments to determine each member's net balance.

**Features:**
- ✅ Calculates expense payments and splits
- ✅ Includes manual payments in balance calculation
- ✅ Returns balances for all group members
- ✅ Single efficient database query
- ✅ Handles members with no expenses

**See also:** [`Settlements/SETTLEMENTS_IMPLEMENTATION_GUIDE.md`](./Settlements/SETTLEMENTS_IMPLEMENTATION_GUIDE.md) for complete implementation guide.

---

## How to Execute Functions

### Option 1: Via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to your project at [https://supabase.com/dashboard](https://supabase.com/dashboard)

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Execute**
   - Open the function file (e.g., `Expenses/upsert-expense-function.sql`)
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" button (or press `Cmd/Ctrl + Enter`)

4. **Verify Success**
   - You should see "Success. No rows returned" message
   - The function is now available in your database

### Option 2: Via Supabase CLI

```bash
# Make sure you're in the split-app directory
cd /Users/bhavi/Documents/split/split-app

# Login to Supabase (if not already logged in)
supabase login

# Link to your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Run the function file
supabase db execute < "DB Migrations/Functions/Expenses/upsert-expense-function.sql"
```

### Option 3: Via psql (Direct Database Connection)

```bash
# Connect to your database
psql "postgresql://postgres:[YOUR_PASSWORD]@[YOUR_HOST]:[PORT]/postgres"

# Execute the file
\i '/Users/bhavi/Documents/split/split-app/DB Migrations/Functions/Expenses/upsert-expense-function.sql'

# Or run it directly
psql "postgresql://..." < "DB Migrations/Functions/Expenses/upsert-expense-function.sql"
```

---

## Usage Examples

### Example 1: Create a New Expense (Equal Split)

```sql
SELECT upsert_expense_from_json('{
  "title": "Team Lunch",
  "group_id": "123e4567-e89b-12d3-a456-426614174000",
  "created_by": "user-uuid-1",
  "currency": "INR",
  "paid_by": "user-uuid-1",
  "amount": 900.00,
  "splits": [
    {
      "user_id": "user-uuid-1",
      "amount": 300.00,
      "split_type": "equal"
    },
    {
      "user_id": "user-uuid-2",
      "amount": 300.00,
      "split_type": "equal"
    },
    {
      "user_id": "user-uuid-3",
      "amount": 300.00,
      "split_type": "equal"
    }
  ]
}'::jsonb);
```

### Example 2: Create a New Expense (Exact Amounts)

```sql
SELECT upsert_expense_from_json('{
  "title": "Movie Night",
  "group_id": "123e4567-e89b-12d3-a456-426614174000",
  "created_by": "user-uuid-1",
  "currency": "INR",
  "paid_by": "user-uuid-1",
  "amount": 450.00,
  "splits": [
    {
      "user_id": "user-uuid-1",
      "amount": 200.00,
      "split_type": "exact"
    },
    {
      "user_id": "user-uuid-2",
      "amount": 250.00,
      "split_type": "exact"
    }
  ]
}'::jsonb);
```

### Example 3: Update an Existing Expense

```sql
SELECT upsert_expense_from_json('{
  "expense_id": "existing-expense-uuid",
  "title": "Updated: Team Lunch at Fancy Restaurant",
  "created_by": "user-uuid-1",
  "currency": "INR",
  "paid_by": "user-uuid-2",
  "amount": 1200.00,
  "splits": [
    {
      "user_id": "user-uuid-1",
      "amount": 400.00,
      "split_type": "equal"
    },
    {
      "user_id": "user-uuid-2",
      "amount": 400.00,
      "split_type": "equal"
    },
    {
      "user_id": "user-uuid-3",
      "amount": 400.00,
      "split_type": "equal"
    }
  ]
}'::jsonb);
```

### Example 4: Personal Expense (No Group)

```sql
SELECT upsert_expense_from_json('{
  "title": "Coffee with Friend",
  "created_by": "user-uuid-1",
  "currency": "INR",
  "paid_by": "user-uuid-1",
  "amount": 200.00,
  "splits": [
    {
      "user_id": "user-uuid-1",
      "amount": 100.00,
      "split_type": "equal"
    },
    {
      "user_id": "user-uuid-2",
      "amount": 100.00,
      "split_type": "equal"
    }
  ]
}'::jsonb);
```

---

## Usage in Application Code

### Using with Supabase Service Role Key

```typescript
// utils/supabase/service.ts (or similar)
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key bypasses RLS
);

// Call the function
const { data, error } = await supabaseAdmin.rpc('upsert_expense_from_json', {
  expense_json: {
    title: "Dinner",
    group_id: "group-uuid",
    created_by: "user-uuid",
    currency: "INR",
    paid_by: "user-uuid",
    amount: 500,
    splits: [
      { user_id: "user-uuid-1", amount: 250, split_type: "equal" },
      { user_id: "user-uuid-2", amount: 250, split_type: "equal" }
    ]
  }
});

if (error) {
  console.error('Error creating expense:', error);
  throw error;
}

console.log('Expense created with ID:', data);
```

### In an API Route (Next.js)

```typescript
// app/api/expenses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServiceClient();

    const { data: expenseId, error } = await supabase.rpc(
      'upsert_expense_from_json',
      { expense_json: body }
    );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      expense_id: expenseId 
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Testing Functions

### Test in Supabase SQL Editor

```sql
-- Test 1: Create a simple expense
SELECT upsert_expense_from_json('{
  "title": "Test Expense",
  "created_by": "YOUR_USER_ID",
  "currency": "INR",
  "paid_by": "YOUR_USER_ID",
  "amount": 100,
  "splits": [
    { "user_id": "YOUR_USER_ID", "amount": 100, "split_type": "equal" }
  ]
}'::jsonb);

-- Test 2: Verify the expense was created
SELECT * FROM expenses ORDER BY created_at DESC LIMIT 1;

-- Test 3: Verify payers were created
SELECT * FROM expense_payers ORDER BY created_at DESC LIMIT 1;

-- Test 4: Verify splits were created
SELECT * FROM expense_splits ORDER BY created_at DESC LIMIT 1;
```

---

## Validation Rules

The function enforces the following rules:

1. **Required Fields:**
   - `title` (non-empty)
   - `created_by` (valid UUID)
   - `paid_by` (valid UUID)
   - `amount` (> 0)
   - `splits` (at least 1)

2. **Optional Fields:**
   - `expense_id` (for updates)
   - `group_id` (for group expenses)
   - `currency` (defaults to 'INR')

3. **Split Validations:**
   - Each split must have `user_id` and `amount`
   - Split type must be 'equal' or 'exact'
   - Total split amounts must equal the expense amount (±0.01 tolerance)
   - If group is specified, all users must be members

4. **Group Validations:**
   - If `group_id` is provided, it must exist
   - Payer must be a member of the group
   - All split users must be members of the group

---

## Troubleshooting

### Common Errors

**Error: "Expense title is required"**
- Ensure `title` field is not empty

**Error: "Total split amounts must equal the paid amount"**
- Verify that the sum of all split amounts equals the expense amount
- Check for rounding errors (tolerance is 0.01)

**Error: "Payer is not a member of the group"**
- Ensure the `paid_by` user exists in `user_group_mapping` for the specified group

**Error: "Split user with ID X is not a member of the group"**
- Ensure all users in splits are members of the group
- Check `user_group_mapping` table

**Error: "Invalid split_type"**
- Use only 'equal' or 'exact' as split_type values

---

## Maintenance

### Updating the Function

1. Modify the SQL file
2. Re-run the function using any of the execution methods above
3. The `DROP FUNCTION IF EXISTS` at the top ensures clean updates

### Rollback

To remove the function:

```sql
DROP FUNCTION IF EXISTS upsert_expense_from_json(JSONB);
DROP FUNCTION IF EXISTS create_expense_from_json(JSONB);
```

---

## Security Notes

- Uses `SECURITY DEFINER` to bypass RLS policies
- Should only be called from backend with service role key
- Never expose this function to client-side code
- All validations are performed server-side

---

## Related Documentation

### Expenses
- [Expenses Table Migration](../Expenses%20table/expenses-table-migration.sql)
- [Expense Payers Migration](../Expense%20Payers%20table/expense-payers-migration.sql)
- [Expense Splits Migration](../Expense%20Splits%20table/expense-splits-migration.sql)
- [Expenses Functions README](./Expenses/README.md)

### Settlements
- [Payments Table Migration](../Payments%20table/README.md)
- [Settlements Functions README](./Settlements/README.md)
- [Settlements Implementation Guide](./Settlements/SETTLEMENTS_IMPLEMENTATION_GUIDE.md)

