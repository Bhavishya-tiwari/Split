# BalanceCard Component

Displays the current user's balance information for a specific group, showing debts, credits, and net balance.

## Overview

The `BalanceCard` component provides a comprehensive view of the user's financial position within a group. It shows:
- What the user owes to other members
- What other members owe to the user
- Net balance (positive = owed money, negative = owes money)
- Total paid and total owed amounts

## Props

```typescript
interface BalanceCardProps {
  groupId: string;        // The ID of the group
  currentUserId: string | null;  // The current authenticated user's ID
}
```

## Features

- **Real-time Balance Calculation**: Fetches balance data using the `useSettlements` hook
- **Loading State**: Shows a spinner while fetching data
- **Error Handling**: Displays user-friendly error messages with helpful hints
- **Empty State**: Handles cases where user is not signed in or data is unavailable
- **Settled State**: Shows a celebration message when all balances are settled
- **Visual Indicators**: Color-coded sections (red for debts, green for credits)
- **Detailed Breakdown**: Lists individual debts and credits with user names
- **Summary Statistics**: Shows total paid, total owed, and net balance

## Component States

### 1. Loading State
- Displays a spinner while fetching balance data
- Uses `Loader2` icon with emerald color

### 2. Error State
- Shows error message in red
- Detects function/migration errors and provides helpful hints
- Suggests checking database function creation

### 3. Empty/Unauthenticated State
- Shown when `currentUserId` is null or data is unavailable
- Prompts user to sign in

### 4. Active Balance State
- **Has Debts**: Shows "You Owe" section with red styling
- **Has Credits**: Shows "You're Owed" section with green styling
- **Net Balance**: Displays final balance with appropriate color coding

### 5. Settled State
- Shows celebration message when `net_balance` is near zero and no debts/credits exist
- Displays green checkmark icon

## Data Structure

The component expects data from the `useSettlements` hook with the following structure:

```typescript
interface SettlementsResponse {
  user_id: string;
  total_paid: number;      // Total amount user has paid
  total_owed: number;       // Total amount user owes
  net_balance: number;     // Net balance (positive = owed money, negative = owes money)
  owes_to: UserDebt[];     // Array of users the current user owes
  owed_by: UserDebt[];     // Array of users who owe the current user
  computed_at: string;     // ISO timestamp of when balance was computed
}

interface UserDebt {
  user_id: string;
  user_name: string;       // Display name or email of the user
  amount: number;          // Amount owed (always positive)
}
```

## Usage

```tsx
import BalanceCard from '@/components/Groups/GroupDetail/BalanceCard';

// In your page component
<BalanceCard 
  groupId={group.id} 
  currentUserId={user?.id || null} 
/>
```

## Dependencies

- **`useSettlements` hook**: Fetches balance data from `/api/groups/[groupId]/settlements`
- **Lucide React Icons**: `Loader2`, `ArrowRight`, `TrendingUp`, `TrendingDown`, `DollarSign`
- **React Query**: Used internally by `useSettlements` for data fetching and caching

## API Integration

The component relies on the settlements API endpoint:
- **Endpoint**: `GET /api/groups/[groupId]/settlements`
- **Authentication**: Required (user must be authenticated)
- **Authorization**: User must be a member of the group
- **Backend Function**: Uses `get_user_balance` SQL function

## Visual Design

- **Card Layout**: White background with rounded corners and shadow
- **Color Coding**:
  - Red: Debts (what you owe)
  - Green: Credits (what you're owed)
  - Gray: Neutral/settled states
- **Typography**: Clear hierarchy with semibold headings and regular body text
- **Icons**: Contextual icons for each section (trending arrows, dollar sign)

## Error Handling

The component handles several error scenarios:

1. **Function Not Found**: Detects when database function is missing and suggests running migration
2. **Network Errors**: Shows generic error message for fetch failures
3. **Unauthorized**: Handled by API, component shows error state
4. **Empty Data**: Returns zero balance structure

## Balance Calculation Logic

- **Net Balance**: `total_paid - total_owed`
- **Settled Check**: `Math.abs(net_balance) < 0.01 && !hasDebts && !hasCredits`
- **Display Threshold**: Balances less than 0.01 are considered zero

## Future Enhancements

- Add ability to mark individual debts as settled
- Add payment tracking integration
- Add historical balance trends
- Add export functionality for balance reports
- Add notifications for new debts/credits
