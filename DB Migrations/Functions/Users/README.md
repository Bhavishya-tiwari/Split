# Users Functions

This folder contains database functions related to user-level calculations and aggregations across all groups.

## Available Functions

### `get_user_total_balances`

**File:** `get-user-total-balances-function.sql`

Calculates the total financial balance details for a user across all groups they are part of. This function aggregates balances from all groups, providing a complete financial overview for the user.

#### Features
- ✅ Calculates expense payments and splits across all groups
- ✅ Includes manual payments in balance calculation
- ✅ Returns detailed breakdown of who the user owes and who owes them (aggregated)
- ✅ Single efficient database query
- ✅ Aggregates balances from all groups the user participates in

#### Parameters
- `p_user_id` (UUID) - The ID of the user whose total balances to calculate

#### Returns
- `user_id` - UUID of the user
- `total_paid` - Total amount paid by the user for expenses across all groups (does NOT include manual payments)
- `total_owed` - Total amount owed by the user from expense splits across all groups (does NOT include payments received)
- `net_balance` - Net balance = (expense_payments + payments_made) - (expense_splits + payments_received) across all groups
- `owes_to` - JSONB array of users the current user owes (aggregated across all groups), with structure:
  ```json
  [
    {
      "user_id": "uuid",
      "amount": 123.45
    }
  ]
  ```
- `owed_by` - JSONB array of users who owe the current user (aggregated across all groups), with structure:
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
-- Get total balances for a user across all groups
SELECT * FROM get_user_total_balances('user-uuid-here');
```

#### How It Works

1. **Total Paid**: Sums all amounts from `expense_payers` where the user is the payer (across all groups)
2. **Total Owed**: Sums all amounts from `expense_splits` where the user is included (across all groups)
3. **Net Balance**: Calculates `(total_paid + payments_made) - (total_owed + payments_received)` across all groups
4. **Owes To**: For each expense where the user has a split but didn't pay, calculates their proportional share owed to each payer across all groups, then subtracts any manual payments made. Amounts are aggregated by creditor user_id.
5. **Owed By**: For each expense where the user paid, calculates how much each split member owes them proportionally across all groups, then subtracts any manual payments received. Amounts are aggregated by debtor user_id.

#### Key Differences from `get_user_balance`

| Feature | `get_user_balance` | `get_user_total_balances` |
|---------|-------------------|-------------------------|
| Scope | Single group | All groups |
| Parameters | `(group_id, user_id)` | `(user_id)` |
| Use Case | Group-specific balance | Overall user balance |
| Aggregation | Per group | Across all groups |

#### Performance Benefits

- Aggregates data at the database level for maximum efficiency
- Returns structured JSONB data ready for API consumption
- Single query to get complete financial overview
- Useful for "Friends" or "All Balances" views

#### Example Use Cases

1. **Friends Page**: Show total balances with all friends across all groups
2. **Dashboard**: Display user's overall financial position
3. **Settlement View**: See who you owe and who owes you in total
4. **Personal Finance**: Track expenses and balances across all groups

## Implementation Guide

### Step 1: Execute the Function

Run the SQL file in your Supabase SQL Editor:

```sql
-- Copy and paste the entire contents of get-user-total-balances-function.sql
-- Then execute it
```

### Step 2: Create API Route

Create an API route to call this function:

```typescript
// app/api/profile/balances/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';
import { createServerClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient.rpc('get_user_total_balances', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('Error fetching user balances:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data[0] || null);
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Step 3: Create React Query Hook

```typescript
// hooks/useUserBalances.ts
import { useQuery } from '@tanstack/react-query';

export function useUserBalances() {
  return useQuery({
    queryKey: ['userTotalBalances'],
    queryFn: async () => {
      const response = await fetch('/api/profile/balances');
      if (!response.ok) {
        throw new Error('Failed to fetch user balances');
      }
      return response.json();
    },
  });
}
```

### Step 4: Use in Component

```typescript
// components/Friends/BalanceCard.tsx
import { useUserBalances } from '@/hooks/useUserBalances';

export function BalanceCard() {
  const { data, isLoading, error } = useUserBalances();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No balance data</div>;

  return (
    <div>
      <h3>Total Balance: ${data.net_balance.toFixed(2)}</h3>
      <div>
        <h4>You Owe:</h4>
        {data.owes_to.map((item: any) => (
          <div key={item.user_id}>
            User {item.user_id}: ${item.amount.toFixed(2)}
          </div>
        ))}
      </div>
      <div>
        <h4>Owed To You:</h4>
        {data.owed_by.map((item: any) => (
          <div key={item.user_id}>
            User {item.user_id}: ${item.amount.toFixed(2)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Related Documentation

- [Settlements Functions](../Settlements/README.md) - For group-specific balance functions
- [Payments Table Migration](../../Payments%20table/README.md)
- [Expenses Table Migration](../../Expenses%20table/README.md)
- [Expense Splits Migration](../../Expense%20Splits%20table/README.md)

