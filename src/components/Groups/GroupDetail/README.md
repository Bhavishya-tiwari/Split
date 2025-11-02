# GroupDetail Components

This directory contains all the components used in the Group Detail page (`/groups/[id]`).

## Component Structure

```
GroupDetail/
├── GroupHeader.tsx         # Group name, description, created date, and settings button
├── ExpensesSection.tsx     # Expenses list with add expense button
├── MembersCard.tsx         # Main members card component (compartmentalized)
├── MembersModal.tsx        # Modal showing all members (compartmentalized)
├── MemberListItem.tsx      # Reusable member display component (compartmentalized)
├── GroupStatsCard.tsx      # Group statistics (total expenses, amount, share)
├── SettingsModal.tsx       # Settings modal with edit and delete options
├── EditGroupModal.tsx      # Modal for editing group details
├── types.ts                # Shared TypeScript types
├── index.ts                # Barrel export file
├── MembersCard.README.md   # Detailed docs for Members components
└── README.md               # This file
```

## Components

### GroupHeader
Displays the group's name, description, creation date, and a settings button for admins.

**Props:**
- `name`: string - Group name
- `description`: string | null - Group description
- `createdAt`: string - ISO date string
- `isAdmin`: boolean - Whether the current user is an admin
- `onSettingsClick`: () => void - Callback when settings button is clicked

---

### ExpensesSection
Shows the list of expenses with an empty state and add expense button.

**Props:**
- `onAddExpense`: () => void - Callback when add expense button is clicked

---

### MembersCard
Displays a summary card of group members with modal functionality. **Compartmentalized into 3 sub-components.**

**Props:**
- `members`: GroupMember[] - Array of group members
- `isAdmin`: boolean - Whether the current user is an admin
- `onAddMember`: () => void - Callback when add member button is clicked

**Sub-components:**
- `MembersModal` - Full-screen modal showing all members
- `MemberListItem` - Reusable component for displaying individual members

📖 See [MembersCard.README.md](./MembersCard.README.md) for detailed documentation.

---

### GroupStatsCard
Shows statistics about the group (expenses count, total amount, user's share).

**Props:**
- `totalExpenses?`: number - Total number of expenses (default: 0)
- `totalAmount?`: string - Total amount spent (default: '$0.00')
- `yourShare?`: string - User's share (default: '$0.00')

---

### SettingsModal
Modal with options to edit or delete the group.

**Props:**
- `isOpen`: boolean - Whether the modal is visible
- `isDeleting`: boolean - Whether a delete operation is in progress
- `onClose`: () => void - Callback to close the modal
- `onEdit`: () => void - Callback when edit is clicked
- `onDelete`: () => void - Callback when delete is clicked

---

### EditGroupModal
Modal for editing group name and description.

**Props:**
- `isOpen`: boolean - Whether the modal is visible
- `isUpdating`: boolean - Whether an update operation is in progress
- `formData`: { name: string, description: string } - Form data
- `error`: string - Error message to display
- `onClose`: () => void - Callback to close the modal
- `onSubmit`: (e: React.FormEvent) => void - Callback when form is submitted
- `onFormChange`: (field: 'name' | 'description', value: string) => void - Callback when form field changes

---

## Types

### Group
```typescript
interface Group {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

### GroupMember
```typescript
interface GroupMember {
  id: string;
  role: string;
  joined_at: string;
  profiles: {
    id: string;
    display_name: string | null;
    email: string;
  };
}
```

## Usage

```tsx
import {
  GroupHeader,
  ExpensesSection,
  MembersCard,
  MembersModal,        // Available if needed separately
  MemberListItem,      // Available if needed separately
  GroupStatsCard,
  SettingsModal,
  EditGroupModal,
  Group,
  GroupMember
} from '@/components/Groups/GroupDetail';

// Use the components in your page
<GroupHeader
  name={group.name}
  description={group.description}
  createdAt={group.created_at}
  isAdmin={userRole === 'admin'}
  onSettingsClick={() => setShowSettingsModal(true)}
/>
```

## Design Principles

1. **Single Responsibility**: Each component has one clear purpose
2. **Reusability**: Components are generic and can be reused
3. **Type Safety**: All props are properly typed with TypeScript
4. **Composition**: Components can be composed together easily
5. **Clean Separation**: Business logic stays in the page, UI in components

