# Members Components

This directory contains compartmentalized components for displaying and managing group members.

## Component Structure

### 1. **MembersCard.tsx** (Main Component)

The entry point component that displays a summary card of group members.

**Features:**

- Shows total member count
- Displays first 3 members
- Shows "+X more members" indicator
- Clickable card that opens the members modal
- Clean, focused responsibility

**Props:**

```typescript
{
  members: GroupMember[];
  isAdmin: boolean;
  onAddMember: () => void;
}
```

**Usage:**

```tsx
<MembersCard members={groupMembers} isAdmin={userRole === 'admin'} onAddMember={handleAddMember} />
```

---

### 2. **MembersModal.tsx** (Modal Component)

A full-screen modal that displays all group members in detail.

**Features:**

- Shows complete list of all members
- Scrollable list for large groups
- Add member button (admin only)
- Close button and backdrop click to dismiss

**Props:**

```typescript
{
  isOpen: boolean;
  onClose: () => void;
  members: GroupMember[];
  isAdmin: boolean;
  onAddMember: () => void;
}
```

---

### 3. **MemberListItem.tsx** (Reusable Item Component)

A flexible component for displaying individual member information.

**Features:**

- Two variants: `compact` and `detailed`
- Compact: Used in the card preview (shows name, role, avatar)
- Detailed: Used in the modal (shows name, email, join date, role badge)

**Props:**

```typescript
{
  member: GroupMember;
  variant?: 'compact' | 'detailed';
}
```

**Usage:**

```tsx
// Compact variant
<MemberListItem member={member} variant="compact" />

// Detailed variant (default in modal)
<MemberListItem member={member} variant="detailed" />
```

---

## Benefits of Compartmentalization

1. **Single Responsibility**: Each component has one clear purpose
2. **Reusability**: `MemberListItem` can be used anywhere
3. **Maintainability**: Easier to find and fix bugs
4. **Testability**: Smaller components are easier to test
5. **Readability**: Clear separation of concerns
6. **Flexibility**: Easy to modify one component without affecting others

---

## File Structure

```
GroupDetail/
├── MembersCard.tsx          # Main card component (63 lines)
├── MembersModal.tsx         # Modal component (79 lines)
├── MemberListItem.tsx       # Reusable list item (60 lines)
├── types.ts                 # Shared TypeScript interfaces
└── index.ts                 # Exports all components
```

---

## Data Flow

```
MembersCard (manages modal state)
    ├── MemberListItem (compact) × 3
    └── MembersModal
            └── MemberListItem (detailed) × N
```

---

## Future Enhancements

- Add member search/filter in modal
- Add member role management
- Add member removal functionality
- Add member invitation flow
- Add loading states for async operations
